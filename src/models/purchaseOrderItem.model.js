module.exports = (sequelize, DataTypes) => {
  const PurchaseOrderItem = sequelize.define(
    'PurchaseOrderItem',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      purchase_order_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      received_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      unit_price: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      subtotal: { type: DataTypes.DECIMAL(16, 2), allowNull: false, defaultValue: 0 },
    },
    { tableName: 'purchase_order_items', paranoid: false }
  );
  return PurchaseOrderItem;
};
