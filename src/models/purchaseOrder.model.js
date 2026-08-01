const STATUSES = ['draft', 'pending', 'approved', 'rejected', 'completed', 'cancelled'];

module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define(
    'PurchaseOrder',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      po_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      supplier_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'draft' },
      order_date: { type: DataTypes.DATEONLY, allowNull: false },
      expected_date: { type: DataTypes.DATEONLY },
      subtotal: { type: DataTypes.DECIMAL(16, 2), allowNull: false, defaultValue: 0 },
      tax_rate: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      tax_amount: { type: DataTypes.DECIMAL(16, 2), allowNull: false, defaultValue: 0 },
      discount: { type: DataTypes.DECIMAL(16, 2), allowNull: false, defaultValue: 0 },
      total: { type: DataTypes.DECIMAL(16, 2), allowNull: false, defaultValue: 0 },
      notes: { type: DataTypes.TEXT },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      approved_by: { type: DataTypes.BIGINT.UNSIGNED },
      approved_at: { type: DataTypes.DATE },
    },
    { tableName: 'purchase_orders' }
  );
  return PurchaseOrder;
};
module.exports.STATUSES = STATUSES;
