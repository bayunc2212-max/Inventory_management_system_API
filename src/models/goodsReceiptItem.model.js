module.exports = (sequelize, DataTypes) => {
  const GoodsReceiptItem = sequelize.define(
    'GoodsReceiptItem',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      goods_receipt_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      purchase_order_item_id: { type: DataTypes.BIGINT.UNSIGNED },
      product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      ordered_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      received_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      damaged_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      shortage_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      expired_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      unit_price: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      note: { type: DataTypes.TEXT },
      total: {
        type: DataTypes.VIRTUAL,
        get() {
          return Number(this.received_qty || 0) * Number(this.unit_price || 0);
        },
      },
    },
    { tableName: 'goods_receipt_items', paranoid: false }
  );
  return GoodsReceiptItem;
};
