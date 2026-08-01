const Joi = require('joi');

const idParam = Joi.object({
  id: Joi.number().integer().positive().required().messages({ 'any.required': 'id wajib diisi' }),
});

const itemParam = Joi.object({
  id: Joi.number().integer().positive().required(),
  itemId: Joi.number().integer().positive().required(),
});

const poItem = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  unit_price: Joi.number().min(0).required(),
});

const createPO = Joi.object({
  supplier_id: Joi.number().integer().positive().required(),
  warehouse_id: Joi.number().integer().positive().required(),
  order_date: Joi.date().required(),
  expected_date: Joi.date().allow(null),
  tax_rate: Joi.number().min(0).max(100).default(0),
  discount: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null),
  items: Joi.array().items(poItem).min(1).required(),
});

const updatePO = Joi.object({
  supplier_id: Joi.number().integer().positive(),
  warehouse_id: Joi.number().integer().positive(),
  order_date: Joi.date(),
  expected_date: Joi.date().allow(null),
  tax_rate: Joi.number().min(0).max(100),
  discount: Joi.number().min(0),
  notes: Joi.string().allow('', null),
  items: Joi.array().items(poItem).min(1),
});

const createGR = Joi.object({
  purchase_order_id: Joi.number().integer().positive().allow(null),
  supplier_id: Joi.number().integer().positive().required(),
  warehouse_id: Joi.number().integer().positive().required(),
  received_date: Joi.date().required(),
  notes: Joi.string().allow('', null),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        purchase_order_item_id: Joi.number().integer().positive().allow(null),
        ordered_qty: Joi.number().integer().min(0).default(0),
        received_qty: Joi.number().integer().positive().required(),
        damaged_qty: Joi.number().integer().min(0).default(0),
        shortage_qty: Joi.number().integer().min(0).default(0),
        expired_qty: Joi.number().integer().min(0).default(0),
        unit_price: Joi.number().min(0).default(0),
        note: Joi.string().allow('', null),
      })
    )
    .min(1)
    .required(),
});

const createStockIn = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  warehouse_id: Joi.number().integer().positive().required(),
  supplier_id: Joi.number().integer().positive().allow(null),
  quantity: Joi.number().integer().positive().required(),
  reason: Joi.string().max(255).allow('', null),
});

const createStockOut = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  warehouse_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  destination: Joi.string().max(255).allow('', null),
  reason: Joi.string().max(255).allow('', null),
});

const transferItem = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  note: Joi.string().allow('', null),
});

const createTransfer = Joi.object({
  from_warehouse_id: Joi.number().integer().positive().required(),
  to_warehouse_id: Joi.number().integer().positive().required(),
  notes: Joi.string().allow('', null),
  items: Joi.array().items(transferItem).min(1).required(),
});

const createAdjustment = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  warehouse_id: Joi.number().integer().positive().required(),
  type: Joi.string().valid('increase', 'decrease').required(),
  quantity: Joi.number().integer().positive().required(),
  reason: Joi.string().max(255).required(),
});

const createOpname = Joi.object({
  warehouse_id: Joi.number().integer().positive().required(),
  opname_date: Joi.date().required(),
  notes: Joi.string().allow('', null),
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        physical_qty: Joi.number().integer().min(0).allow(null),
        note: Joi.string().allow('', null),
      })
    )
    .min(1)
    .required(),
});

const opnameItemBody = Joi.object({
  product_id: Joi.number().integer().positive().required(),
});

const opnameItemUpdate = Joi.object({
  physical_qty: Joi.number().integer().min(0).required(),
  note: Joi.string().allow('', null),
});

module.exports = {
  idParam,
  itemParam,
  createPO,
  updatePO,
  createGR,
  createStockIn,
  createStockOut,
  createTransfer,
  createAdjustment,
  createOpname,
  opnameItemBody,
  opnameItemUpdate,
};
