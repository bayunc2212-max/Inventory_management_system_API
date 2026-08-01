const STATUSES = ['pending', 'approved', 'rejected'];

module.exports = (sequelize, DataTypes) => {
  const StockAdjustment = sequelize.define(
    'StockAdjustment',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      adjustment_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      type: { type: DataTypes.ENUM('increase', 'decrease'), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.STRING(255) },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'pending' },
      approved_by: { type: DataTypes.BIGINT.UNSIGNED },
      approved_at: { type: DataTypes.DATE },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    },
    { tableName: 'stock_adjustments' }
  );
  return StockAdjustment;
};
module.exports.STATUSES = STATUSES;
