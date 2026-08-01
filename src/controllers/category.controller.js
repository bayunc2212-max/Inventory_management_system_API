const { Category, Product } = require('../models');
const { createMasterController } = require('./master.factory');

module.exports = createMasterController({
  model: Category,
  label: 'Kategori',
  searchable: ['name', 'code'],
  filterable: { is_active: 'boolean', parent_id: 'number' },
  includes: [
    { association: 'parent', attributes: ['id', 'name', 'code'] },
    { association: 'children', attributes: ['id', 'name', 'code'] },
  ],
  uniqueFields: ['name'],
  deleteGuards: [
    { model: Product, fk: 'category_id', label: 'produk' },
    { model: Category, fk: 'parent_id', label: 'sub-kategori' },
  ],
});
