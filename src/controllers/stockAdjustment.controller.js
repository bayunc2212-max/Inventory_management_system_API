const { sequelize, StockAdjustment, Product, Warehouse, User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { recordMovement } = require('../services/stock.service');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { generateNumber } = require('../utils/helpers');

const includes = [
  { association: 'product', attributes: ['id', 'name', 'sku', 'unit'] },
  { association: 'warehouse', attributes: ['id', 'code', 'name'] },
  { association: 'creator', attributes: ['id', 'name'] },
  { association: 'approver', attributes: ['id', 'name'] },
];

const index = asyncHandler(async (req, res) => {
  const options = buildListOptions({
    query: req.query,
    searchable: ['adjustment_number', 'reason'],
    filterable: { status: 'string', type: 'string', warehouse_id: 'number', product_id: 'number' },
  });
  const { rows, count } = await StockAdjustment.findAndCountAll({ ...options, include: includes });
  return ApiResponse.ok(res, rows, 'Daftar penyesuaian stok', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const show = asyncHandler(async (req, res) => {
  const row = await StockAdjustment.findByPk(req.params.id, { include: includes });
  if (!row) throw ApiError.notFound('Penyesuaian stok tidak ditemukan');
  return ApiResponse.ok(res, row);
});

const create = asyncHandler(async (req, res) => {
  const { product_id, warehouse_id, type, quantity, reason } = req.body;
  if (Number(quantity) <= 0) throw ApiError.badRequest('Quantity harus lebih dari 0');
  if (!['increase', 'decrease'].includes(type)) throw ApiError.badRequest('Tipe harus increase atau decrease');

  const adjustment = await StockAdjustment.create({
    adjustment_number: generateNumber('ADJ'),
    product_id,
    warehouse_id,
    type,
    quantity,
    reason,
    status: 'pending',
    created_by: req.user.id,
  });

  await writeAudit({
    userId: req.user.id,
    action: 'create',
    entityType: 'stockadjustment',
    entityId: adjustment.id,
    after: { adjustment_number: adjustment.adjustment_number, type, quantity },
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  const row = await StockAdjustment.findByPk(adjustment.id, { include: includes });
  return ApiResponse.created(res, row, 'Permintaan penyesuaian dibuat');
});

const approve = asyncHandler(async (req, res) => {
  const adjustment = await StockAdjustment.findByPk(req.params.id);
  if (!adjustment) throw ApiError.notFound('Penyesuaian stok tidak ditemukan');
  if (adjustment.status !== 'pending') throw ApiError.badRequest('Hanya penyesuaian pending yang dapat disetujui');

  const qtyChange = adjustment.type === 'increase' ? adjustment.quantity : -adjustment.quantity;

  await sequelize.transaction(async (t) => {
    await recordMovement({
      transaction: t,
      productId: adjustment.product_id,
      warehouseId: adjustment.warehouse_id,
      type: 'adjustment',
      qtyChange,
      refType: 'StockAdjustment',
      refId: adjustment.id,
      note: adjustment.reason || `Penyesuaian ${adjustment.adjustment_number}`,
      userId: req.user.id,
    });
    await adjustment.update(
      { status: 'approved', approved_by: req.user.id, approved_at: new Date() },
      { transaction: t }
    );
  });

  await writeAudit({
    userId: req.user.id,
    action: 'approve',
    entityType: 'stockadjustment',
    entityId: adjustment.id,
    after: { status: 'approved' },
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, adjustment, 'Penyesuaian disetujui, stok diperbarui');
});

const reject = asyncHandler(async (req, res) => {
  const adjustment = await StockAdjustment.findByPk(req.params.id);
  if (!adjustment) throw ApiError.notFound('Penyesuaian stok tidak ditemukan');
  if (adjustment.status !== 'pending') throw ApiError.badRequest('Hanya penyesuaian pending yang dapat ditolak');
  await adjustment.update({ status: 'rejected' });
  return ApiResponse.ok(res, adjustment, 'Penyesuaian ditolak');
});

module.exports = { index, show, create, approve, reject };
