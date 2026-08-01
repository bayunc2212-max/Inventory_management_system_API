module.exports = (sequelize, DataTypes) => {
  const StockOpnameItem = sequelize.define(
    'StockOpnameItem',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      stock_opname_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      system_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      physical_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      difference_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      note: { type: DataTypes.TEXT },
    },
    { tableName: 'stock_opname_items', paranoid: false }
  );
  return StockOpnameItem;
};
