const { Product, Category, Brand, Warehouse, StorageLocation, StockMovement, PurchaseOrderItem } = require('../models');
const { sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { Op } = require('sequelize');

const includes = [
  { association: 'category', attributes: ['id', 'name', 'code'] },
  { association: 'brand', attributes: ['id', 'name'] },
  { association: 'warehouse', attributes: ['id', 'code', 'name'] },
  { association: 'location', attributes: ['id', 'code', 'name'] },
];

const assertUnique = async (body, currentId) => {
  for (const field of ['sku', 'barcode', 'qr_code']) {
    const value = body[field];
    if (value === undefined || value === null || value === '') continue;
    const where = { [field]: String(value).trim() };
    if (currentId) where.id = { [Op.ne]: currentId };
    const exists = await Product.findOne({ where });
    if (exists) {
      const label = { sku: 'SKU', barcode: 'Barcode', qr_code: 'QR code' }[field];
      throw ApiError.conflict(`${label} sudah digunakan oleh produk lain`);
    }
  }
};

const index = asyncHandler(async (req, res) => {
  const { low_stock = '' } = req.query;
  const options = buildListOptions({
    query: req.query,
    searchable: ['name', 'sku', 'barcode'],
    filterable: {
      category_id: 'number',
      brand_id: 'number',
      warehouse_id: 'number',
      location_id: 'number',
      is_active: 'boolean',
    },
  });
  if (low_stock === 'true') {
    options.where = {
      [Op.and]: [
        options.where,
        sequelize.where(sequelize.col('current_stock'), '<=', sequelize.col('min_stock')),
      ],
    };
  }
  const { rows, count } = await Product.findAndCountAll({ ...options, include: includes });
  return ApiResponse.ok(res, rows, 'Daftar produk', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const listAll = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.is_active === 'true' || req.query.is_active === 'false') {
    where.is_active = req.query.is_active === 'true';
  }
  if (req.query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { sku: { [Op.like]: `%${req.query.search}%` } },
      { barcode: { [Op.like]: `%${req.query.search}%` } },
    ];
  }
  const rows = await Product.findAll({ where, include: includes, order: [['name', 'ASC']], limit: 1000 });
  return ApiResponse.ok(res, rows, 'Daftar produk');
});

const show = asyncHandler(async (req, res) => {
  const row = await Product.findByPk(req.params.id, { include: includes });
  if (!row) throw ApiError.notFound('Produk tidak ditemukan');
  return ApiResponse.ok(res, row);
});

const create = asyncHandler(async (req, res) => {
  await assertUnique(req.body, null);
  const row = await Product.create(req.body);
  await writeAudit({
    userId: req.user.id,
    action: 'create',
    entityType: 'product',
    entityId: row.id,
    after: req.body,
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.created(res, row, 'Produk berhasil dibuat');
});

const update = asyncHandler(async (req, res) => {
  const row = await Product.findByPk(req.params.id);
  if (!row) throw ApiError.notFound('Produk tidak ditemukan');
  await assertUnique(req.body, row.id);

  const before = row.toJSON();
  await row.update(req.body);
  await writeAudit({
    userId: req.user.id,
    action: 'update',
    entityType: 'product',
    entityId: row.id,
    before,
    after: row.toJSON(),
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, row, 'Produk berhasil diperbarui');
});

const remove = asyncHandler(async (req, res) => {
  const row = await Product.findByPk(req.params.id);
  if (!row) throw ApiError.notFound('Produk tidak ditemukan');

  const [movementCount, poCount] = await Promise.all([
    StockMovement.count({ where: { product_id: row.id } }),
    PurchaseOrderItem.count({ where: { product_id: row.id } }),
  ]);
  if (movementCount > 0 || poCount > 0) {
    throw ApiError.conflict('Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi');
  }

  await row.destroy();
  await writeAudit({
    userId: req.user.id,
    action: 'delete',
    entityType: 'product',
    entityId: row.id,
    before: row.toJSON(),
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, null, 'Produk berhasil dihapus');
});

const summary = asyncHandler(async (req, res) => {
  const [[{ totalValue }]] = await sequelize.query(
    'SELECT COALESCE(SUM(current_stock * cost_price), 0) AS totalValue FROM products'
  );
  const [[{ lowStock }]] = await sequelize.query(
    'SELECT COUNT(*) AS lowStock FROM products WHERE is_active = 1 AND current_stock <= min_stock'
  );
  const [total, outOfStock] = await Promise.all([
    Product.count({ where: { is_active: true } }),
    Product.count({ where: { is_active: true, current_stock: 0 } }),
  ]);
  return ApiResponse.ok(res, {
    totalProducts: total,
    inventoryValue: Number(totalValue || 0),
    lowStock: Number(lowStock || 0),
    outOfStock,
  });
});

module.exports = { index, listAll, show, create, update, remove, summary };
