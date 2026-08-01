const { StockMovement, Product, Warehouse, User } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { Op } = require('sequelize');

const includes = [
  { association: 'product', attributes: ['id', 'name', 'sku', 'unit'] },
  { association: 'warehouse', attributes: ['id', 'code', 'name'] },
  { association: 'creator', attributes: ['id', 'name'] },
];

const index = asyncHandler(async (req, res) => {
  const options = buildListOptions({
    query: req.query,
    searchable: ['note'],
    filterable: {
      product_id: 'number',
      warehouse_id: 'number',
      type: 'string',
      ref_type: 'string',
    },
  });

  const { start_date, end_date } = req.query;
  if (start_date || end_date) {
    const createdAt = {};
    if (start_date) createdAt[Op.gte] = new Date(`${start_date}T00:00:00`);
    if (end_date) createdAt[Op.lte] = new Date(`${end_date}T23:59:59`);
    options.where.created_at = createdAt;
  }

  const { rows, count } = await StockMovement.findAndCountAll({ ...options, include: includes });
  return ApiResponse.ok(res, rows, 'Riwayat pergerakan stok', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const byProduct = asyncHandler(async (req, res) => {
  const { product_id, limit = 50 } = req.query;
  const where = {};
  if (product_id) where.product_id = product_id;
  const rows = await StockMovement.findAll({
    where,
    include: includes,
    order: [['id', 'DESC']],
    limit: Math.min(Number(limit), 500),
  });
  return ApiResponse.ok(res, rows, 'Riwayat pergerakan stok');
});

module.exports = { index, byProduct };
