const STATUSES = ['pending', 'shipped', 'received', 'cancelled'];

module.exports = (sequelize, DataTypes) => {
  const StockTransfer = sequelize.define(
    'StockTransfer',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      transfer_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      from_warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      to_warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'pending' },
      notes: { type: DataTypes.TEXT },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      sent_by: { type: DataTypes.BIGINT.UNSIGNED },
      received_by: { type: DataTypes.BIGINT.UNSIGNED },
      sent_at: { type: DataTypes.DATE },
      received_at: { type: DataTypes.DATE },
    },
    { tableName: 'stock_transfers' }
  );
  return StockTransfer;
};
module.exports.STATUSES = STATUSES;
