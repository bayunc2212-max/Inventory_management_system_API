const { sequelize, StockOut, Product, Warehouse, Customer, User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { recordMovement } = require('../services/stock.service');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { generateNumber } = require('../utils/helpers');

const STATUSES = StockOut.STATUSES;

const includes = [
  { association: 'product', attributes: ['id', 'name', 'sku', 'unit'] },
  { association: 'warehouse', attributes: ['id', 'code', 'name'] },
  { association: 'creator', attributes: ['id', 'name'] },
  { association: 'approver', attributes: ['id', 'name'] },
];

const index = asyncHandler(async (req, res) => {
  const options = buildListOptions({
    query: req.query,
    searchable: ['out_number', 'destination', 'reason'],
    filterable: { status: 'string', warehouse_id: 'number', product_id: 'number' },
  });
  const { rows, count } = await StockOut.findAndCountAll({ ...options, include: includes });
  return ApiResponse.ok(res, rows, 'Daftar stock out', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const show = asyncHandler(async (req, res) => {
  const row = await StockOut.findByPk(req.params.id, { include: includes });
  if (!row) throw ApiError.notFound('Stock out tidak ditemukan');
  return ApiResponse.ok(res, row);
});

const create = asyncHandler(async (req, res) => {
  const { product_id, warehouse_id, quantity, destination, reason } = req.body;
  if (Number(quantity) <= 0) throw ApiError.badRequest('Quantity harus lebih dari 0');

  const stockOut = await StockOut.create({
    out_number: generateNumber('OUT'),
    product_id,
    warehouse_id,
    quantity,
    destination,
    reason,
    status: 'pending',
    created_by: req.user.id,
  });

  await writeAudit({
    userId: req.user.id,
    action: 'create',
    entityType: 'stockout',
    entityId: stockOut.id,
    after: { out_number: stockOut.out_number, quantity },
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  const row = await StockOut.findByPk(stockOut.id, { include: includes });
  return ApiResponse.created(res, row, 'Permintaan stock out dibuat');
});

const approve = asyncHandler(async (req, res) => {
  const stockOut = await StockOut.findByPk(req.params.id);
  if (!stockOut) throw ApiError.notFound('Stock out tidak ditemukan');
  if (stockOut.status !== 'pending') throw ApiError.badRequest('Hanya stock out pending yang dapat disetujui');

  await sequelize.transaction(async (t) => {
    await recordMovement({
      transaction: t,
      productId: stockOut.product_id,
      warehouseId: stockOut.warehouse_id,
      type: 'stock_out',
      qtyChange: -stockOut.quantity,
      refType: 'StockOut',
      refId: stockOut.id,
      note: stockOut.reason || `Stock out ${stockOut.out_number}`,
      userId: req.user.id,
    });
    await stockOut.update(
      { status: 'completed', approved_by: req.user.id, approved_at: new Date() },
      { transaction: t }
    );
  });

  await writeAudit({
    userId: req.user.id,
    action: 'approve',
    entityType: 'stockout',
    entityId: stockOut.id,
    after: { status: 'completed' },
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, stockOut, 'Stock out disetujui, stok berkurang');
});

const reject = asyncHandler(async (req, res) => {
  const stockOut = await StockOut.findByPk(req.params.id);
  if (!stockOut) throw ApiError.notFound('Stock out tidak ditemukan');
  if (stockOut.status !== 'pending') throw ApiError.badRequest('Hanya stock out pending yang dapat ditolak');

  await stockOut.update({ status: 'rejected' });
  return ApiResponse.ok(res, stockOut, 'Stock out ditolak');
});

module.exports = { index, show, create, approve, reject };
