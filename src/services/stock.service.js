const { Product, StockMovement } = require('../models');
const ApiError = require('../utils/ApiError');

const recordMovement = async ({
  transaction,
  productId,
  warehouseId,
  type,
  qtyChange,
  refType,
  refId,
  note,
  userId,
}) => {
  const product = await Product.findByPk(productId, {
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
  if (!product) throw ApiError.notFound('Produk tidak ditemukan');

  const newBalance = Number(product.current_stock) + Number(qtyChange);
  if (newBalance < 0) throw ApiError.badRequest('Stok tidak mencukupi');

  await product.update({ current_stock: newBalance }, { transaction });

  await StockMovement.create(
    {
      product_id: productId,
      warehouse_id: warehouseId,
      type,
      qty_change: qtyChange,
      balance_after: newBalance,
      ref_type: refType,
      ref_id: refId,
      note,
      created_by: userId,
    },
    { transaction }
  );

  return newBalance;
};

const getProductSnapshot = async (productId, transaction) => {
  const product = await Product.findByPk(productId, { transaction });
  return product ? Number(product.current_stock) : 0;
};

module.exports = { recordMovement, getProductSnapshot };
