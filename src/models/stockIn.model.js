module.exports = (sequelize, DataTypes) => {
  const StockIn = sequelize.define(
    'StockIn',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      ins_number: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      supplier_id: { type: DataTypes.BIGINT.UNSIGNED },
      quantity: { type: DataTypes.INTEGER, allowNull: false },
      reason: { type: DataTypes.STRING(255) },
      proof_image: { type: DataTypes.STRING(255) },
      ref_type: { type: DataTypes.STRING(50) },
      ref_id: { type: DataTypes.BIGINT.UNSIGNED },
      created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    },
    { tableName: 'stock_ins' }
  );
  return StockIn;
};
