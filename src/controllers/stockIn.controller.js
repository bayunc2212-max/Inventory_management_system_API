const { sequelize, StockIn, Product, Warehouse, Supplier, User } = require('../models');
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
  { association: 'supplier', attributes: ['id', 'company_name'] },
  { association: 'creator', attributes: ['id', 'name'] },
];

const index = asyncHandler(async (req, res) => {
  const options = buildListOptions({
    query: req.query,
    searchable: ['ins_number', 'reason'],
    filterable: { warehouse_id: 'number', supplier_id: 'number', product_id: 'number' },
  });
  const { rows, count } = await StockIn.findAndCountAll({ ...options, include: includes });
  return ApiResponse.ok(res, rows, 'Daftar stock in', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const show = asyncHandler(async (req, res) => {
  const row = await StockIn.findByPk(req.params.id, { include: includes });
  if (!row) throw ApiError.notFound('Stock in tidak ditemukan');
  return ApiResponse.ok(res, row);
});

const create = asyncHandler(async (req, res) => {
  const { product_id, warehouse_id, supplier_id = null, quantity, reason } = req.body;
  if (Number(quantity) <= 0) throw ApiError.badRequest('Quantity harus lebih dari 0');

  const result = await sequelize.transaction(async (t) => {
    const stockIn = await StockIn.create(
      {
        ins_number: generateNumber('IN'),
        product_id,
        warehouse_id,
        supplier_id,
        quantity,
        reason,
        created_by: req.user.id,
      },
      { transaction: t }
    );

    await recordMovement({
      transaction: t,
      productId: product_id,
      warehouseId: warehouse_id,
      type: 'stock_in',
      qtyChange: quantity,
      refType: 'StockIn',
      refId: stockIn.id,
      note: reason || `Stock in ${stockIn.ins_number}`,
      userId: req.user.id,
    });
    return stockIn;
  });

  await writeAudit({
    userId: req.user.id,
    action: 'create',
    entityType: 'stockin',
    entityId: result.id,
    after: { ins_number: result.ins_number, quantity },
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  const row = await StockIn.findByPk(result.id, { include: includes });
  return ApiResponse.created(res, row, 'Barang masuk berhasil, stok bertambah');
});

const cancel = asyncHandler(async (req, res) => {
  const stockIn = await StockIn.findByPk(req.params.id);
  if (!stockIn) throw ApiError.notFound('Stock in tidak ditemukan');

  await sequelize.transaction(async (t) => {
    await recordMovement({
      transaction: t,
      productId: stockIn.product_id,
      warehouseId: stockIn.warehouse_id,
      type: 'stock_in',
      qtyChange: -stockIn.quantity,
      refType: 'StockIn',
      refId: stockIn.id,
      note: `Pembatalan ${stockIn.ins_number}`,
      userId: req.user.id,
    });
    await stockIn.destroy({ transaction: t });
  });

  await writeAudit({
    userId: req.user.id,
    action: 'delete',
    entityType: 'stockin',
    entityId: stockIn.id,
    before: { ins_number: stockIn.ins_number },
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, null, 'Stock in dibatalkan, stok dikembalikan');
});

module.exports = { index, show, create, cancel };
