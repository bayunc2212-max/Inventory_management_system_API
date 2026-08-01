const { Customer, StockOut } = require('../models');
const { createMasterController } = require('./master.factory');

module.exports = createMasterController({
  model: Customer,
  label: 'Pelanggan',
  searchable: ['name', 'phone', 'email'],
  filterable: { is_active: 'boolean' },
  includes: [],
  uniqueFields: [],
  deleteGuards: [{ model: StockOut, fk: 'customer_id', label: 'transaksi stock out' }],
});
