module.exports = (sequelize, DataTypes) => {
  const Supplier = sequelize.define(
    'Supplier',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      company_name: { type: DataTypes.STRING(200), allowNull: false },
      pic_name: { type: DataTypes.STRING(150) },
      phone: { type: DataTypes.STRING(30) },
      email: { type: DataTypes.STRING(150) },
      address: { type: DataTypes.TEXT },
      npwp: { type: DataTypes.STRING(50) },
      notes: { type: DataTypes.TEXT },
      rating: { type: DataTypes.DECIMAL(3, 1), allowNull: false, defaultValue: 0 },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'suppliers' }
  );
  return Supplier;
};
