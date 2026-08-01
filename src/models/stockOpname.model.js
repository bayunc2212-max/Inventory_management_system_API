const STATUSES = ['draft', 'ongoing', 'submitted', 'approved', 'rejected', 'completed'];

module.exports = (sequelize, DataTypes) => {
  const StockOpname = sequelize.define(
    'StockOpname',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      opname_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'draft' },
      opname_date: { type: DataTypes.DATEONLY, allowNull: false },
      notes: { type: DataTypes.TEXT },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      approved_by: { type: DataTypes.BIGINT.UNSIGNED },
      approved_at: { type: DataTypes.DATE },
    },
    { tableName: 'stock_opnames' }
  );
  return StockOpname;
};
module.exports.STATUSES = STATUSES;
