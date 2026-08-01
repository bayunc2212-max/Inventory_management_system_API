const { sequelize, PurchaseOrder, PurchaseOrderItem, Product, Supplier, Warehouse, User } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { generateNumber } = require('../utils/helpers');
const { Op } = require('sequelize');

const STATUSES = PurchaseOrder.STATUSES;

const includes = [
  { association: 'supplier', attributes: ['id', 'company_name', 'pic_name'] },
  { association: 'warehouse', attributes: ['id', 'code', 'name'] },
  { association: 'creator', attributes: ['id', 'name'] },
  { association: 'approver', attributes: ['id', 'name'] },
];

const itemIncludes = [
  { association: 'items', include: [{ association: 'product', attributes: ['id', 'name', 'sku', 'unit'] }] },
];

const computeTotals = (items, taxRate, discount) => {
  const subtotal = items.reduce((sum, it) => sum + Number(it.quantity || 0) * Number(it.unit_price || 0), 0);
  const taxAmount = (subtotal * Number(taxRate || 0)) / 100;
  const total = subtotal + taxAmount - Number(discount || 0);
  return { subtotal, taxAmount, total };
};

const index = asyncHandler(async (req, res) => {
  const options = buildListOptions({
    query: req.query,
    searchable: ['po_number', 'notes'],
    filterable: { status: 'string', supplier_id: 'number', warehouse_id: 'number' },
  });
  const { rows, count } = await PurchaseOrder.findAndCountAll({ ...options, include: includes });
  return ApiResponse.ok(res, rows, 'Daftar purchase order', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const show = asyncHandler(async (req, res) => {
  const row = await PurchaseOrder.findByPk(req.params.id, { include: [...includes, ...itemIncludes] });
  if (!row) throw ApiError.notFound('Purchase order tidak ditemukan');
  return ApiResponse.ok(res, row);
});

const create = asyncHandler(async (req, res) => {
  const { supplier_id, warehouse_id, order_date, expected_date, tax_rate = 0, discount = 0, notes, items = [] } = req.body;

  if (!Array.isArray(items) || items.length === 0) throw ApiError.badRequest('Minimal satu item produk wajib diisi');
  const productIds = items.map((i) => i.product_id);
  const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });
  if (products.length !== new Set(productIds).size) throw ApiError.badRequest('Ada produk yang tidak ditemukan');

  const { subtotal, taxAmount, total } = computeTotals(items, tax_rate, discount);

  const result = await sequelize.transaction(async (t) => {
    const po = await PurchaseOrder.create(
      {
        po_number: generateNumber('PO'),
        supplier_id,
        warehouse_id,
        status: 'draft',
        order_date,
        expected_date: expected_date || null,
        subtotal,
        tax_rate: tax_rate || 0,
        tax_amount: taxAmount,
        discount: discount || 0,
        total,
        notes,
        created_by: req.user.id,
      },
      { transaction: t }
    );

    await PurchaseOrderItem.bulkCreate(
      items.map((it) => ({
        purchase_order_id: po.id,
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        subtotal: it.quantity * it.unit_price,
      })),
      { transaction: t }
    );
    return po;
  });

  await writeAudit({
    userId: req.user.id,
    action: 'create',
    entityType: 'purchaseorder',
    entityId: result.id,
    after: { po_number: result.po_number, total },
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  const po = await PurchaseOrder.findByPk(result.id, { include: [...includes, ...itemIncludes] });
  return ApiResponse.created(res, po, 'Purchase order berhasil dibuat');
});

const update = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw ApiError.notFound('Purchase order tidak ditemukan');
  if (po.status !== 'draft') throw ApiError.badRequest('Hanya PO berstatus draft yang dapat diubah');

  const { supplier_id, warehouse_id, order_date, expected_date, tax_rate, discount, notes, items } = req.body;

  await sequelize.transaction(async (t) => {
    if (items) {
      const productIds = items.map((i) => i.product_id);
      const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } }, { transaction: t });
      if (products.length !== new Set(productIds).size) throw ApiError.badRequest('Ada produk yang tidak ditemukan');
      const { subtotal, taxAmount, total } = computeTotals(items, tax_rate ?? po.tax_rate, discount ?? po.discount);
      await PurchaseOrderItem.destroy({ where: { purchase_order_id: po.id }, transaction: t });
      await PurchaseOrderItem.bulkCreate(
        items.map((it) => ({
          purchase_order_id: po.id,
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          subtotal: it.quantity * it.unit_price,
        })),
        { transaction: t }
      );
      await po.update({ subtotal, tax_amount: taxAmount, total }, { transaction: t });
    }
    await po.update(
      {
        supplier_id: supplier_id ?? po.supplier_id,
        warehouse_id: warehouse_id ?? po.warehouse_id,
        order_date: order_date ?? po.order_date,
        expected_date: expected_date !== undefined ? expected_date : po.expected_date,
        tax_rate: tax_rate !== undefined ? tax_rate : po.tax_rate,
        discount: discount !== undefined ? discount : po.discount,
        notes: notes !== undefined ? notes : po.notes,
      },
      { transaction: t }
    );
  });

  const updated = await PurchaseOrder.findByPk(po.id, { include: [...includes, ...itemIncludes] });
  return ApiResponse.ok(res, updated, 'Purchase order berhasil diperbarui');
});

const transition = (statuses) =>
  asyncHandler(async (req, res) => {
    const po = await PurchaseOrder.findByPk(req.params.id);
    if (!po) throw ApiError.notFound('Purchase order tidak ditemukan');
    const { next, label } = statuses;
    if (!next.includes(po.status)) throw ApiError.badRequest(`PO berstatus ${po.status} tidak dapat diubah ke ${label}`);

    const payload = { status: label };
    if (label === 'approved') {
      payload.approved_by = req.user.id;
      payload.approved_at = new Date();
    }
    if (label === 'rejected') payload.notes = req.body.notes || po.notes;

    await po.update(payload);
    await writeAudit({
      userId: req.user.id,
      action: `po_${label}`,
      entityType: 'purchaseorder',
      entityId: po.id,
      after: { status: label },
      ip: req.ip,
      ua: req.get('user-agent'),
    });
    const messageMap = {
      pending: 'PO dikirim untuk persetujuan',
      approved: 'PO disetujui',
      rejected: 'PO ditolak',
      cancelled: 'PO dibatalkan',
      completed: 'PO selesai',
    };
    return ApiResponse.ok(res, po, messageMap[label] || `Status PO menjadi ${label}`);
  });

const submit = transition({ next: ['draft'], label: 'pending' });
const approve = transition({ next: ['pending'], label: 'approved' });
const reject = transition({ next: ['pending', 'approved'], label: 'rejected' });
const cancel = transition({ next: ['draft', 'pending'], label: 'cancelled' });

module.exports = { index, show, create, update, submit, approve, reject, cancel };
