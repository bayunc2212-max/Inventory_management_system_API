const Joi = require('joi');

const idParam = Joi.object({
  id: Joi.number().integer().positive().required().messages({ 'any.required': 'id wajib diisi' }),
});

const booleanOpt = Joi.boolean().allow(null);

const warehouse = {
  createWarehouse: Joi.object({
    code: Joi.string().max(30).required().messages({ 'any.required': 'Kode wajib diisi' }),
    name: Joi.string().max(150).required().messages({ 'any.required': 'Nama wajib diisi' }),
    branch_id: Joi.number().integer().positive().allow(null),
    address: Joi.string().allow('', null),
    pic_name: Joi.string().max(150).allow('', null),
    phone: Joi.string().max(30).allow('', null),
    is_active: booleanOpt,
  }),
  updateWarehouse: Joi.object({
    code: Joi.string().max(30),
    name: Joi.string().max(150),
    branch_id: Joi.number().integer().positive().allow(null),
    address: Joi.string().allow('', null),
    pic_name: Joi.string().max(150).allow('', null),
    phone: Joi.string().max(30).allow('', null),
    is_active: Joi.boolean(),
  }),
};

const location = {
  createLocation: Joi.object({
    warehouse_id: Joi.number().integer().positive().required().messages({ 'any.required': 'Gudang wajib diisi' }),
    parent_id: Joi.number().integer().positive().allow(null),
    type: Joi.string().valid('area', 'rack', 'shelf', 'bin').default('bin'),
    code: Joi.string().max(50).required().messages({ 'any.required': 'Kode wajib diisi' }),
    name: Joi.string().max(150).required().messages({ 'any.required': 'Nama wajib diisi' }),
    description: Joi.string().allow('', null),
  }),
  updateLocation: Joi.object({
    warehouse_id: Joi.number().integer().positive(),
    parent_id: Joi.number().integer().positive().allow(null),
    type: Joi.string().valid('area', 'rack', 'shelf', 'bin'),
    code: Joi.string().max(50),
    name: Joi.string().max(150),
    description: Joi.string().allow('', null),
  }),
};

const supplier = {
  createSupplier: Joi.object({
    company_name: Joi.string().max(200).required().messages({ 'any.required': 'Nama perusahaan wajib diisi' }),
    pic_name: Joi.string().max(150).allow('', null),
    phone: Joi.string().max(30).allow('', null),
    email: Joi.string().email().allow('', null).messages({ 'string.email': 'Email tidak valid' }),
    address: Joi.string().allow('', null),
    npwp: Joi.string().max(50).allow('', null),
    notes: Joi.string().allow('', null),
    rating: Joi.number().min(0).max(5),
    is_active: booleanOpt,
  }),
  updateSupplier: Joi.object({
    company_name: Joi.string().max(200),
    pic_name: Joi.string().max(150).allow('', null),
    phone: Joi.string().max(30).allow('', null),
    email: Joi.string().email().allow('', null).messages({ 'string.email': 'Email tidak valid' }),
    address: Joi.string().allow('', null),
    npwp: Joi.string().max(50).allow('', null),
    notes: Joi.string().allow('', null),
    rating: Joi.number().min(0).max(5),
    is_active: Joi.boolean(),
  }),
};

const customer = {
  createCustomer: Joi.object({
    name: Joi.string().max(150).required().messages({ 'any.required': 'Nama wajib diisi' }),
    phone: Joi.string().max(30).allow('', null),
    email: Joi.string().email().allow('', null).messages({ 'string.email': 'Email tidak valid' }),
    address: Joi.string().allow('', null),
    notes: Joi.string().allow('', null),
    is_active: booleanOpt,
  }),
  updateCustomer: Joi.object({
    name: Joi.string().max(150),
    phone: Joi.string().max(30).allow('', null),
    email: Joi.string().email().allow('', null).messages({ 'string.email': 'Email tidak valid' }),
    address: Joi.string().allow('', null),
    notes: Joi.string().allow('', null),
    is_active: Joi.boolean(),
  }),
};

const category = {
  createCategory: Joi.object({
    name: Joi.string().max(150).required().messages({ 'any.required': 'Nama wajib diisi' }),
    code: Joi.string().max(50).allow('', null),
    parent_id: Joi.number().integer().positive().allow(null),
    description: Joi.string().allow('', null),
    is_active: booleanOpt,
  }),
  updateCategory: Joi.object({
    name: Joi.string().max(150),
    code: Joi.string().max(50).allow('', null),
    parent_id: Joi.number().integer().positive().allow(null),
    description: Joi.string().allow('', null),
    is_active: Joi.boolean(),
  }),
};

const brand = {
  createBrand: Joi.object({
    name: Joi.string().max(150).required().messages({ 'any.required': 'Nama wajib diisi' }),
    description: Joi.string().allow('', null),
    is_active: booleanOpt,
  }),
  updateBrand: Joi.object({
    name: Joi.string().max(150),
    description: Joi.string().allow('', null),
    is_active: Joi.boolean(),
  }),
};

const product = {
  createProduct: Joi.object({
    name: Joi.string().max(200).required().messages({ 'any.required': 'Nama wajib diisi' }),
    sku: Joi.string().max(60).required().messages({ 'any.required': 'SKU wajib diisi' }),
    barcode: Joi.string().max(60).allow('', null),
    qr_code: Joi.string().max(120).allow('', null),
    category_id: Joi.number().integer().positive().allow(null),
    brand_id: Joi.number().integer().positive().allow(null),
    unit: Joi.string().max(30).default('pcs'),
    cost_price: Joi.number().min(0).default(0),
    selling_price: Joi.number().min(0).default(0),
    min_stock: Joi.number().integer().min(0).default(0),
    max_stock: Joi.number().integer().min(0).allow(null),
    warehouse_id: Joi.number().integer().positive().allow(null),
    location_id: Joi.number().integer().positive().allow(null),
    weight: Joi.number().min(0).allow(null),
    expired_at: Joi.date().allow(null),
    description: Joi.string().allow('', null),
    image: Joi.string().max(255).allow('', null),
    is_active: booleanOpt,
  }),
  updateProduct: Joi.object({
    name: Joi.string().max(200),
    sku: Joi.string().max(60),
    barcode: Joi.string().max(60).allow('', null),
    qr_code: Joi.string().max(120).allow('', null),
    category_id: Joi.number().integer().positive().allow(null),
    brand_id: Joi.number().integer().positive().allow(null),
    unit: Joi.string().max(30),
    cost_price: Joi.number().min(0),
    selling_price: Joi.number().min(0),
    min_stock: Joi.number().integer().min(0),
    max_stock: Joi.number().integer().min(0).allow(null),
    warehouse_id: Joi.number().integer().positive().allow(null),
    location_id: Joi.number().integer().positive().allow(null),
    weight: Joi.number().min(0).allow(null),
    expired_at: Joi.date().allow(null),
    description: Joi.string().allow('', null),
    image: Joi.string().max(255).allow('', null),
    is_active: Joi.boolean(),
  }),
};

module.exports = { idParam, warehouse, location, supplier, customer, category, brand, product };
