const { sequelize, StockTransfer, StockTransferItem, Product, Warehouse, User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { recordMovement } = require('../services/stock.service');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { generateNumber } = require('../utils/helpers');
const { Op } = require('sequelize');

const includes = [
  { association: 'fromWarehouse', attributes: ['id', 'code', 'name'] },
  { association: 'toWarehouse', attributes: ['id', 'code', 'name'] },
  { association: 'creator', attributes: ['id', 'name'] },
  { association: 'sender', attributes: ['id', 'name'] },
  { association: 'receiver', attributes: ['id', 'name'] },
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
    searchable: ['transfer_number', 'notes'],
    filterable: { status: 'string', from_warehouse_id: 'number', to_warehouse_id: 'number' },
  });
  const { rows, count } = await StockTransfer.findAndCountAll({ ...options, include: includes });
  return ApiResponse.ok(res, rows, 'Daftar transfer stok', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const show = asyncHandler(async (req, res) => {
  const row = await StockTransfer.findByPk(req.params.id, { include: [...includes, ...itemIncludes] });
  if (!row) throw ApiError.notFound('Transfer stok tidak ditemukan');
  return ApiResponse.ok(res, row);
});

const create = asyncHandler(async (req, res) => {
  const { from_warehouse_id, to_warehouse_id, notes, items = [] } = req.body;
  if (!Array.isArray(items) || items.length === 0) throw ApiError.badRequest('Minimal satu item wajib diisi');
  if (from_warehouse_id === to_warehouse_id) throw ApiError.badRequest('Gudang asal dan tujuan tidak boleh sama');

  const productIds = items.map((i) => i.product_id);
  const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
  if (products.length !== new Set(productIds).size) throw ApiError.badRequest('Ada produk yang tidak ditemukan');

  const result = await sequelize.transaction(async (t) => {
    const transfer = await StockTransfer.create(
      {
        transfer_number: generateNumber('TRF'),
        from_warehouse_id,
        to_warehouse_id,
        status: 'pending',
        notes,
        created_by: req.user.id,
      },
      { transaction: t }
    );

    await StockTransferItem.bulkCreate(
      items.map((it) => ({
        stock_transfer_id: transfer.id,
        product_id: it.product_id,
        quantity: it.quantity,
        note: it.note || null,
      })),
      { transaction: t }
    );
    return transfer;
  });

  const row = await StockTransfer.findByPk(result.id, { include: [...includes, ...itemIncludes] });
  return ApiResponse.created(res, row, 'Transfer stok dibuat');
});

const ship = asyncHandler(async (req, res) => {
  const transfer = await StockTransfer.findByPk(req.params.id, { include: itemIncludes });
  if (!transfer) throw ApiError.notFound('Transfer stok tidak ditemukan');
  if (transfer.status !== 'pending') throw ApiError.badRequest('Hanya transfer pending yang dapat dikirim');

  await sequelize.transaction(async (t) => {
    for (const item of transfer.items) {
      await recordMovement({
        transaction: t,
        productId: item.product_id,
        warehouseId: transfer.from_warehouse_id,
        type: 'transfer_out',
        qtyChange: -item.quantity,
        refType: 'StockTransfer',
        refId: transfer.id,
        note: `Kirim ${transfer.transfer_number}`,
        userId: req.user.id,
      });
    }
    await transfer.update(
      { status: 'shipped', sent_by: req.user.id, sent_at: new Date() },
      { transaction: t }
    );
  });

  await writeAudit({
    userId: req.user.id,
    action: 'ship',
    entityType: 'stocktransfer',
    entityId: transfer.id,
    after: { status: 'shipped' },
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, transfer, 'Transfer dikirim, stok asal berkurang');
});

const receive = asyncHandler(async (req, res) => {
  const transfer = await StockTransfer.findByPk(req.params.id, { include: itemIncludes });
  if (!transfer) throw ApiError.notFound('Transfer stok tidak ditemukan');
  if (transfer.status !== 'shipped') throw ApiError.badRequest('Hanya transfer terkirim yang dapat diterima');

  await sequelize.transaction(async (t) => {
    for (const item of transfer.items) {
      await recordMovement({
        transaction: t,
        productId: item.product_id,
        warehouseId: transfer.to_warehouse_id,
        type: 'transfer_in',
        qtyChange: item.quantity,
        refType: 'StockTransfer',
        refId: transfer.id,
        note: `Terima ${transfer.transfer_number}`,
        userId: req.user.id,
      });
      await StockTransferItem.update(
        { received_qty: item.quantity },
        { where: { id: item.id }, transaction: t }
      );
    }
    await transfer.update(
      { status: 'received', received_by: req.user.id, received_at: new Date() },
      { transaction: t }
    );
  });

  await writeAudit({
    userId: req.user.id,
    action: 'receive',
    entityType: 'stocktransfer',
    entityId: transfer.id,
    after: { status: 'received' },
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, transfer, 'Transfer diterima, stok tujuan bertambah');
});

const cancel = asyncHandler(async (req, res) => {
  const transfer = await StockTransfer.findByPk(req.params.id);
  if (!transfer) throw ApiError.notFound('Transfer stok tidak ditemukan');
  if (transfer.status !== 'pending') throw ApiError.badRequest('Hanya transfer pending yang dapat dibatalkan');
  await transfer.update({ status: 'cancelled' });
  return ApiResponse.ok(res, transfer, 'Transfer dibatalkan');
});

module.exports = { index, show, create, ship, receive, cancel };
