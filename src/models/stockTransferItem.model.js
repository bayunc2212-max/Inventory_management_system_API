module.exports = (sequelize, DataTypes) => {
  const StockTransferItem = sequelize.define(
    'StockTransferItem',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      stock_transfer_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      received_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      note: { type: DataTypes.TEXT },
    },
    { tableName: 'stock_transfer_items', paranoid: false }
  );
  return StockTransferItem;
};
