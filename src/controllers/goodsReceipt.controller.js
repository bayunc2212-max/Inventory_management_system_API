const { sequelize, GoodsReceipt, GoodsReceiptItem, PurchaseOrder, PurchaseOrderItem, Product, Supplier, Warehouse, User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { recordMovement } = require('../services/stock.service');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { generateNumber } = require('../utils/helpers');
const { Op } = require('sequelize');

const includes = [
  { association: 'supplier', attributes: ['id', 'company_name'] },
  { association: 'warehouse', attributes: ['id', 'code', 'name'] },
  { association: 'creator', attributes: ['id', 'name'] },
  { association: 'purchaseOrder', attributes: ['id', 'po_number', 'status'] },
];

const itemIncludes = [
  {
    association: 'items',
    include: [
      { association: 'product', attributes: ['id', 'name', 'sku', 'unit'] },
      { association: 'poItem', attributes: ['id', 'quantity', 'unit_price'] },
    ],
  },
];

const index = asyncHandler(async (req, res) => {
  const options = buildListOptions({
    query: req.query,
    searchable: ['gr_number', 'notes'],
    filterable: { status: 'string', supplier_id: 'number', warehouse_id: 'number', purchase_order_id: 'number' },
  });
  const attributes = {
    include: [
      [
        sequelize.literal(
          '(SELECT COALESCE(SUM(ri.received_qty * ri.unit_price), 0) FROM goods_receipt_items ri WHERE ri.goods_receipt_id = GoodsReceipt.id)'
        ),
        'total_amount',
      ],
    ],
  };
  const { rows, count } = await GoodsReceipt.findAndCountAll({ ...options, include: includes, attributes });
  return ApiResponse.ok(res, rows, 'Daftar penerimaan barang', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const show = asyncHandler(async (req, res) => {
  const row = await GoodsReceipt.findByPk(req.params.id, { include: [...includes, ...itemIncludes] });
  if (!row) throw ApiError.notFound('Penerimaan barang tidak ditemukan');
  row.dataValues.total_amount = (row.items || []).reduce(
    (s, it) => s + Number(it.received_qty || 0) * Number(it.unit_price || 0),
    0
  );
  return ApiResponse.ok(res, row);
});

const create = asyncHandler(async (req, res) => {
  const { purchase_order_id = null, supplier_id, warehouse_id, received_date, notes, items = [] } = req.body;

  if (!Array.isArray(items) || items.length === 0) throw ApiError.badRequest('Minimal satu item wajib diisi');
  if (items.some((it) => Number(it.received_qty) <= 0)) throw ApiError.badRequest('Received qty harus lebih dari 0');

  const productIds = items.map((i) => i.product_id);
  const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
  if (products.length !== new Set(productIds).size) throw ApiError.badRequest('Ada produk yang tidak ditemukan');

  const result = await sequelize.transaction(async (t) => {
    const totalReceived = items.reduce((s, it) => s + Number(it.received_qty || 0), 0);
    const totalDamaged = items.reduce((s, it) => s + Number(it.damaged_qty || 0), 0);
    const totalShortage = items.reduce((s, it) => s + Number(it.shortage_qty || 0), 0);
    const totalExpired = items.reduce((s, it) => s + Number(it.expired_qty || 0), 0);

    const gr = await GoodsReceipt.create(
      {
        gr_number: generateNumber('GR'),
        purchase_order_id,
        supplier_id,
        warehouse_id,
        status: 'received',
        received_date,
        notes,
        total_received_qty: totalReceived,
        total_damaged_qty: totalDamaged,
        total_shortage_qty: totalShortage,
        total_expired_qty: totalExpired,
        created_by: req.user.id,
      },
      { transaction: t }
    );

    for (const it of items) {
      await GoodsReceiptItem.create(
        {
          goods_receipt_id: gr.id,
          purchase_order_item_id: it.purchase_order_item_id || null,
          product_id: it.product_id,
          ordered_qty: it.ordered_qty || 0,
          received_qty: it.received_qty,
          damaged_qty: it.damaged_qty || 0,
          shortage_qty: it.shortage_qty || 0,
          expired_qty: it.expired_qty || 0,
          unit_price: it.unit_price || 0,
          note: it.note || null,
        },
        { transaction: t }
      );

      await recordMovement({
        transaction: t,
        productId: it.product_id,
        warehouseId: warehouse_id,
        type: 'receiving',
        qtyChange: it.received_qty,
        refType: 'GoodsReceipt',
        refId: gr.id,
        note: `Penerimaan barang ${gr.gr_number}`,
        userId: req.user.id,
      });

      if (it.purchase_order_item_id) {
        const poItem = await PurchaseOrderItem.findByPk(it.purchase_order_item_id, { transaction: t });
        if (poItem) {
          await poItem.update({ received_qty: poItem.received_qty + Number(it.received_qty) }, { transaction: t });
        }
      }
    }

    if (purchase_order_id) {
      const po = await PurchaseOrder.findByPk(purchase_order_id, { transaction: t });
      if (po) {
        const poItems = await PurchaseOrderItem.findAll({ where: { purchase_order_id: po.id }, transaction: t });
        const allReceived = poItems.every((p) => Number(p.received_qty) >= Number(p.quantity));
        if (allReceived && poItems.length > 0) await po.update({ status: 'completed' }, { transaction: t });
      }
    }

    return gr;
  });

  await writeAudit({
    userId: req.user.id,
    action: 'create',
    entityType: 'goodsreceipt',
    entityId: result.id,
    after: { gr_number: result.gr_number },
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  const gr = await GoodsReceipt.findByPk(result.id, { include: [...includes, ...itemIncludes] });
  gr.dataValues.total_amount = (gr.items || []).reduce((s, it) => s + Number(it.received_qty || 0) * Number(it.unit_price || 0), 0);
  return ApiResponse.created(res, gr, 'Penerimaan barang berhasil, stok bertambah');
});

const reject = asyncHandler(async (req, res) => {
  const gr = await GoodsReceipt.findByPk(req.params.id);
  if (!gr) throw ApiError.notFound('Penerimaan barang tidak ditemukan');
  if (gr.status !== 'received') throw ApiError.badRequest('Hanya GR berstatus received yang dapat ditolak');
  await gr.update({ status: 'rejected' });
  return ApiResponse.ok(res, gr, 'Penerimaan barang ditolak');
});

module.exports = { index, show, create, reject };
