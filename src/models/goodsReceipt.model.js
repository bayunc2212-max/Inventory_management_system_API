const STATUSES = ['pending', 'received', 'completed', 'rejected'];

module.exports = (sequelize, DataTypes) => {
  const GoodsReceipt = sequelize.define(
    'GoodsReceipt',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      gr_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      purchase_order_id: { type: DataTypes.BIGINT.UNSIGNED },
      supplier_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'pending' },
      received_date: { type: DataTypes.DATEONLY, allowNull: false },
      notes: { type: DataTypes.TEXT },
      total_received_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      total_damaged_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      total_shortage_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      total_expired_qty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    },
    { tableName: 'goods_receipts' }
  );
  return GoodsReceipt;
};
module.exports.STATUSES = STATUSES;
