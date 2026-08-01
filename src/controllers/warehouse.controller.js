const { Warehouse, Branch, StorageLocation, Product } = require('../models');
const { createMasterController } = require('./master.factory');

module.exports = createMasterController({
  model: Warehouse,
  label: 'Gudang',
  searchable: ['code', 'name', 'pic_name', 'phone'],
  filterable: { is_active: 'boolean', branch_id: 'number' },
  includes: [
    { association: 'branch', attributes: ['id', 'name'] },
    { association: 'locations', attributes: ['id', 'code', 'name'] },
  ],
  uniqueFields: ['code'],
  deleteGuards: [
    { model: StorageLocation, fk: 'warehouse_id', label: 'lokasi' },
    { model: Product, fk: 'warehouse_id', label: 'produk' },
  ],
});
