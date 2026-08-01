const { sequelize, Product, StockMovement, PurchaseOrder, Warehouse, Category } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

const dashboard = asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(todayStart);
  monthStart.setDate(1);

  const [[{ totalProducts, totalValue, lowStock, outOfStock }]] = await sequelize.query(`
    SELECT
      COUNT(*) AS totalProducts,
      COALESCE(SUM(current_stock * cost_price), 0) AS totalValue,
      SUM(CASE WHEN is_active = 1 AND current_stock <= min_stock THEN 1 ELSE 0 END) AS lowStock,
      SUM(CASE WHEN is_active = 1 AND current_stock = 0 THEN 1 ELSE 0 END) AS outOfStock
    FROM products
  `);

  const [[{ inToday, outToday }]] = await sequelize.query(
    `SELECT
      COALESCE(SUM(CASE WHEN qty_change > 0 THEN qty_change ELSE 0 END), 0) AS inToday,
      COALESCE(SUM(CASE WHEN qty_change < 0 THEN ABS(qty_change) ELSE 0 END), 0) AS outToday
     FROM stock_movements WHERE created_at >= :start`,
    { replacements: { start: todayStart } }
  );

  const [[{ inMonth, outMonth }]] = await sequelize.query(
    `SELECT
      COALESCE(SUM(CASE WHEN qty_change > 0 THEN qty_change ELSE 0 END), 0) AS inMonth,
      COALESCE(SUM(CASE WHEN qty_change < 0 THEN ABS(qty_change) ELSE 0 END), 0) AS outMonth
     FROM stock_movements WHERE created_at >= :start`,
    { replacements: { start: monthStart } }
  );

  const [pendingPOs, recentMovements, lowStockProducts, topProducts] = await Promise.all([
    PurchaseOrder.count({ where: { status: 'pending' } }),
    StockMovement.findAll({
      include: [
        { association: 'product', attributes: ['id', 'name', 'sku', 'unit'] },
        { association: 'warehouse', attributes: ['id', 'code', 'name'] },
      ],
      order: [['id', 'DESC']],
      limit: 10,
    }),
    Product.findAll({
      where: {
        is_active: true,
        [Op.and]: [sequelize.where(sequelize.col('current_stock'), '<=', sequelize.col('min_stock'))],
      },
      order: [['current_stock', 'ASC']],
      limit: 8,
    }),
    sequelize.query(
      `SELECT p.id, p.name, p.sku, p.unit,
              COALESCE(SUM(CASE WHEN m.qty_change < 0 THEN ABS(m.qty_change) ELSE 0 END), 0) AS total_out,
              p.current_stock
         FROM products p
         LEFT JOIN stock_movements m ON m.product_id = p.id
        WHERE m.created_at >= :start
        GROUP BY p.id
        ORDER BY total_out DESC
        LIMIT 8`,
      { replacements: { start: monthStart }, type: sequelize.QueryTypes.SELECT }
    ),
  ]);

  return ApiResponse.ok(res, {
    summary: {
      totalProducts: Number(totalProducts),
      inventoryValue: Number(totalValue),
      lowStock: Number(lowStock),
      outOfStock: Number(outOfStock),
      inToday: Number(inToday),
      outToday: Number(outToday),
      inMonth: Number(inMonth),
      outMonth: Number(outMonth),
      pendingPOs,
    },
    recentMovements,
    lowStockProducts,
    topProducts,
  });
});

const stockReport = asyncHandler(async (req, res) => {
  const { warehouse_id, category_id, low_stock } = req.query;
  const where = { is_active: true };
  if (warehouse_id) where.warehouse_id = warehouse_id;
  if (category_id) where.category_id = category_id;
  if (low_stock === 'true') where[Op.and] = [sequelize.where(sequelize.col('current_stock'), '<=', sequelize.col('min_stock'))];

  const rows = await Product.findAll({
    where,
    include: [
      { association: 'category', attributes: ['id', 'name'] },
      { association: 'warehouse', attributes: ['id', 'code', 'name'] },
      { association: 'brand', attributes: ['id', 'name'] },
    ],
    order: [['name', 'ASC']],
  });

  const mapped = rows.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    unit: p.unit,
    category: p.category?.name,
    brand: p.brand?.name,
    warehouse: p.warehouse?.code,
    current_stock: Number(p.current_stock),
    min_stock: Number(p.min_stock),
    cost_price: Number(p.cost_price),
    selling_price: Number(p.selling_price),
    stock_value: Number(p.current_stock) * Number(p.cost_price),
  }));

  const totalValue = mapped.reduce((s, r) => s + r.stock_value, 0);
  return ApiResponse.ok(res, { rows: mapped, totalValue });
});

const movementReport = asyncHandler(async (req, res) => {
  const { start_date, end_date, product_id, warehouse_id, type } = req.query;
  const where = {};
  if (product_id) where.product_id = product_id;
  if (warehouse_id) where.warehouse_id = warehouse_id;
  if (type) where.type = type;
  if (start_date || end_date) {
    const createdAt = {};
    if (start_date) createdAt[Op.gte] = new Date(`${start_date}T00:00:00`);
    if (end_date) createdAt[Op.lte] = new Date(`${end_date}T23:59:59`);
    where.created_at = createdAt;
  }

  const rows = await StockMovement.findAll({
    where,
    include: [
      { association: 'product', attributes: ['id', 'name', 'sku', 'unit'] },
      { association: 'warehouse', attributes: ['id', 'code', 'name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 2000,
  });

  const summary = {
    totalIn: rows.filter((r) => Number(r.qty_change) > 0).reduce((s, r) => s + Number(r.qty_change), 0),
    totalOut: rows.filter((r) => Number(r.qty_change) < 0).reduce((s, r) => s + Math.abs(Number(r.qty_change)), 0),
    count: rows.length,
  };
  return ApiResponse.ok(res, { rows, summary });
});

const exportMovements = asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;
  const where = {};
  if (start_date || end_date) {
    const createdAt = {};
    if (start_date) createdAt[Op.gte] = new Date(`${start_date}T00:00:00`);
    if (end_date) createdAt[Op.lte] = new Date(`${end_date}T23:59:59`);
    where.created_at = createdAt;
  }

  const rows = await StockMovement.findAll({
    where,
    include: [
      { association: 'product', attributes: ['id', 'name', 'sku', 'unit'] },
      { association: 'warehouse', attributes: ['id', 'code', 'name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: 5000,
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Stockify';
  const sheet = workbook.addWorksheet('Pergerakan Stok');
  sheet.columns = [
    { header: 'Tanggal', key: 'date', width: 20 },
    { header: 'Produk', key: 'product', width: 30 },
    { header: 'SKU', key: 'sku', width: 18 },
    { header: 'Gudang', key: 'warehouse', width: 18 },
    { header: 'Tipe', key: 'type', width: 16 },
    { header: 'Perubahan', key: 'change', width: 12 },
    { header: 'Saldo Akhir', key: 'balance', width: 12 },
    { header: 'Referensi', key: 'ref', width: 24 },
    { header: 'Catatan', key: 'note', width: 30 },
  ];
  sheet.getRow(1).font = { bold: true };
  rows.forEach((r) => {
    sheet.addRow({
      date: r.created_at,
      product: r.product?.name,
      sku: r.product?.sku,
      warehouse: r.warehouse?.code,
      type: r.type,
      change: r.qty_change,
      balance: r.balance_after,
      ref: `${r.ref_type}:${r.ref_id}`,
      note: r.note,
    });
  });

  const filename = `movements-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

const exportStock = asyncHandler(async (req, res) => {
  const { warehouse_id, category_id, low_stock } = req.query;
  const where = { is_active: true };
  if (warehouse_id) where.warehouse_id = warehouse_id;
  if (category_id) where.category_id = category_id;
  if (low_stock === 'true') where[Op.and] = [sequelize.where(sequelize.col('current_stock'), '<=', sequelize.col('min_stock'))];

  const rows = await Product.findAll({
    where,
    include: [
      { association: 'category', attributes: ['id', 'name'] },
      { association: 'warehouse', attributes: ['id', 'code', 'name'] },
      { association: 'brand', attributes: ['id', 'name'] },
    ],
    order: [['name', 'ASC']],
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Stockify';
  const sheet = workbook.addWorksheet('Laporan Stok');
  sheet.columns = [
    { header: 'SKU', key: 'sku', width: 18 },
    { header: 'Nama Produk', key: 'name', width: 30 },
    { header: 'Kategori', key: 'category', width: 18 },
    { header: 'Brand', key: 'brand', width: 18 },
    { header: 'Gudang', key: 'warehouse', width: 18 },
    { header: 'Satuan', key: 'unit', width: 10 },
    { header: 'Stok', key: 'stock', width: 10 },
    { header: 'Stok Min', key: 'min', width: 10 },
    { header: 'Harga Beli', key: 'cost', width: 15 },
    { header: 'Harga Jual', key: 'price', width: 15 },
    { header: 'Nilai Stok', key: 'value', width: 15 },
  ];
  sheet.getRow(1).font = { bold: true };
  rows.forEach((p) => {
    sheet.addRow({
      sku: p.sku,
      name: p.name,
      category: p.category?.name,
      brand: p.brand?.name,
      warehouse: p.warehouse?.code,
      unit: p.unit,
      stock: Number(p.current_stock),
      min: Number(p.min_stock),
      cost: Number(p.cost_price),
      price: Number(p.selling_price),
      value: Number(p.current_stock) * Number(p.cost_price),
    });
  });

  const filename = `stock-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = { dashboard, stockReport, movementReport, exportMovements, exportStock };
