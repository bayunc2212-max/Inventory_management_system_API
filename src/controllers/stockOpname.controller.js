const { sequelize, StockOpname, StockOpnameItem, Product, Warehouse, User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { recordMovement } = require('../services/stock.service');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { generateNumber } = require('../utils/helpers');
const { Op } = require('sequelize');

const includes = [
  { association: 'warehouse', attributes: ['id', 'code', 'name'] },
  { association: 'creator', attributes: ['id', 'name'] },
  { association: 'approver', attributes: ['id', 'name'] },
];

const itemIncludes = [
  {
    association: 'items',
    include: [{ association: 'product', attributes: ['id', 'name', 'sku', 'unit'] }],
  },
];

const index = asyncHandler(async (req, res) => {
  const options = buildListOptions({
    query: req.query,
    searchable: ['opname_number', 'notes'],
    filterable: { status: 'string', warehouse_id: 'number' },
  });
  const { rows, count } = await StockOpname.findAndCountAll({ ...options, include: includes });
  return ApiResponse.ok(res, rows, 'Daftar opname stok', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const show = asyncHandler(async (req, res) => {
  const row = await StockOpname.findByPk(req.params.id, { include: [...includes, ...itemIncludes] });
  if (!row) throw ApiError.notFound('Opname stok tidak ditemukan');
  return ApiResponse.ok(res, row);
});

const create = asyncHandler(async (req, res) => {
  const { warehouse_id, opname_date, notes, items = [] } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw ApiError.badRequest('Pilih minimal satu produk');

  const productIds = items.map((i) => i.product_id);
  const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
  if (products.length !== new Set(productIds).size) throw ApiError.badRequest('Ada produk yang tidak ditemukan');
  const stockMap = Object.fromEntries(products.map((p) => [p.id, Number(p.current_stock)]));

  const result = await sequelize.transaction(async (t) => {
    const opname = await StockOpname.create(
      {
        opname_number: generateNumber('OPN'),
        warehouse_id,
        status: 'draft',
        opname_date,
        notes,
        created_by: req.user.id,
      },
      { transaction: t }
    );

    await StockOpnameItem.bulkCreate(
      items.map((it) => {
        const systemQty = stockMap[it.product_id] || 0;
        return {
          stock_opname_id: opname.id,
          product_id: it.product_id,
          system_qty: systemQty,
          physical_qty: it.physical_qty ?? systemQty,
          difference_qty: (it.physical_qty ?? systemQty) - systemQty,
          note: it.note || null,
        };
      }),
      { transaction: t }
    );
    return opname;
  });

  const row = await StockOpname.findByPk(result.id, { include: [...includes, ...itemIncludes] });
  return ApiResponse.created(res, row, 'Opname stok dibuat');
});

const addItem = asyncHandler(async (req, res) => {
  const opname = await StockOpname.findByPk(req.params.id);
  if (!opname) throw ApiError.notFound('Opname stok tidak ditemukan');
  if (!['draft', 'ongoing'].includes(opname.status)) throw ApiError.badRequest('Opname tidak dalam proses');

  const { product_id } = req.body;
  const existing = await StockOpnameItem.findOne({ where: { stock_opname_id: opname.id, product_id } });
  if (existing) throw ApiError.conflict('Produk sudah ada dalam opname');

  const product = await Product.findByPk(product_id);
  if (!product) throw ApiError.notFound('Produk tidak ditemukan');

  const systemQty = Number(product.current_stock);
  const item = await StockOpnameItem.create({
    stock_opname_id: opname.id,
    product_id,
    system_qty: systemQty,
    physical_qty: systemQty,
    difference_qty: 0,
  });
  if (opname.status === 'draft') await opname.update({ status: 'ongoing' });
  return ApiResponse.created(res, item, 'Produk ditambahkan ke opname');
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await StockOpnameItem.findByPk(req.params.itemId);
  if (!item) throw ApiError.notFound('Item opname tidak ditemukan');

  const opname = await StockOpname.findByPk(item.stock_opname_id);
  if (!opname || !['draft', 'ongoing'].includes(opname.status)) throw ApiError.badRequest('Opname tidak dalam proses');

  const { physical_qty, note } = req.body;
  const physical = physical_qty !== undefined ? Number(physical_qty) : item.physical_qty;
  if (physical < 0) throw ApiError.badRequest('Physical qty tidak boleh negatif');

  await item.update({ physical_qty: physical, difference_qty: physical - Number(item.system_qty), note });
  return ApiResponse.ok(res, item, 'Hasil hitung diperbarui');
});

const submit = asyncHandler(async (req, res) => {
  const opname = await StockOpname.findByPk(req.params.id);
  if (!opname) throw ApiError.notFound('Opname stok tidak ditemukan');
  if (!['draft', 'ongoing'].includes(opname.status)) throw ApiError.badRequest('Opname tidak dalam proses');
  await opname.update({ status: 'submitted' });
  return ApiResponse.ok(res, opname, 'Opname dikirim untuk persetujuan');
});

const approve = asyncHandler(async (req, res) => {
  const opname = await StockOpname.findByPk(req.params.id, { include: itemIncludes });
  if (!opname) throw ApiError.notFound('Opname stok tidak ditemukan');
  if (opname.status !== 'submitted') throw ApiError.badRequest('Hanya opname submitted yang dapat disetujui');

  await sequelize.transaction(async (t) => {
    for (const item of opname.items) {
      const diff = Number(item.difference_qty);
      if (diff === 0) continue;
      await recordMovement({
        transaction: t,
        productId: item.product_id,
        warehouseId: opname.warehouse_id,
        type: 'opname',
        qtyChange: diff,
        refType: 'StockOpname',
        refId: opname.id,
        note: `Opname ${opname.opname_number} (sistem ${item.system_qty} → fisik ${item.physical_qty})`,
        userId: req.user.id,
      });
    }
    await opname.update(
      { status: 'approved', approved_by: req.user.id, approved_at: new Date() },
      { transaction: t }
    );
  });

  await writeAudit({
    userId: req.user.id,
    action: 'approve',
    entityType: 'stockopname',
    entityId: opname.id,
    after: { status: 'approved' },
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, opname, 'Opname disetujui, stok disesuaikan');
});

const reject = asyncHandler(async (req, res) => {
  const opname = await StockOpname.findByPk(req.params.id);
  if (!opname) throw ApiError.notFound('Opname stok tidak ditemukan');
  if (opname.status !== 'submitted') throw ApiError.badRequest('Hanya opname submitted yang dapat ditolak');
  await opname.update({ status: 'rejected' });
  return ApiResponse.ok(res, opname, 'Opname ditolak');
});

module.exports = { index, show, create, addItem, updateItem, submit, approve, reject };
