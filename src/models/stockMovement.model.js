const TYPES = [
  'stock_in',
  'stock_out',
  'purchase',
  'receiving',
  'transfer_out',
  'transfer_in',
  'adjustment',
  'opname',
  'sale',
];

module.exports = (sequelize, DataTypes) => {
  const StockMovement = sequelize.define(
    'StockMovement',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      type: { type: DataTypes.ENUM(...TYPES), allowNull: false },
      qty_change: { type: DataTypes.INTEGER, allowNull: false },
      balance_after: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      ref_type: { type: DataTypes.STRING(50) },
      ref_id: { type: DataTypes.BIGINT.UNSIGNED },
      note: { type: DataTypes.STRING(255) },
      created_by: { type: DataTypes.BIGINT.UNSIGNED },
    },
    {
      tableName: 'stock_movements',
      paranoid: false,
      updatedAt: false,
    }
  );
  return StockMovement;
};
module.exports.TYPES = TYPES;
