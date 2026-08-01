module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      phone: { type: DataTypes.STRING(30) },
      email: { type: DataTypes.STRING(150) },
      address: { type: DataTypes.TEXT },
      notes: { type: DataTypes.TEXT },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'customers' }
  );
  return Customer;
};
