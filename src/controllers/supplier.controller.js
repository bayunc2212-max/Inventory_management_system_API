const { Supplier, PurchaseOrder, StockIn, GoodsReceipt } = require('../models');
const { createMasterController } = require('./master.factory');

module.exports = createMasterController({
  model: Supplier,
  label: 'Supplier',
  searchable: ['company_name', 'pic_name', 'phone', 'email', 'npwp'],
  filterable: { is_active: 'boolean' },
  includes: [],
  uniqueFields: [],
  deleteGuards: [
    { model: PurchaseOrder, fk: 'supplier_id', label: 'purchase order' },
    { model: GoodsReceipt, fk: 'supplier_id', label: 'penerimaan barang' },
    { model: StockIn, fk: 'supplier_id', label: 'transaksi stock in' },
  ],
});
