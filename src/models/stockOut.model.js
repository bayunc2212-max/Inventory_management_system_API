const STATUSES = ['pending', 'approved', 'rejected', 'completed'];

module.exports = (sequelize, DataTypes) => {
  const StockOut = sequelize.define(
    'StockOut',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      out_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      destination: { type: DataTypes.STRING(255) },
      reason: { type: DataTypes.STRING(255) },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'pending' },
      approved_by: { type: DataTypes.BIGINT.UNSIGNED },
      approved_at: { type: DataTypes.DATE },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    },
    { tableName: 'stock_outs' }
  );
  return StockOut;
};
module.exports.STATUSES = STATUSES;
