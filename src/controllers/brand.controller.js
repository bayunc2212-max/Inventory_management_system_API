const { Brand, Product } = require('../models');
const { createMasterController } = require('./master.factory');

module.exports = createMasterController({
  model: Brand,
  label: 'Brand',
  searchable: ['name'],
  filterable: { is_active: 'boolean' },
  includes: [],
  uniqueFields: ['name'],
  deleteGuards: [{ model: Product, fk: 'brand_id', label: 'produk' }],
});
