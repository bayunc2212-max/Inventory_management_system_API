module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define(
    'Branch',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      address: { type: DataTypes.TEXT },
      phone: { type: DataTypes.STRING(30) },
      email: { type: DataTypes.STRING(150) },
      city: { type: DataTypes.STRING(100) },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'branches' }
  );
  return Branch;
};
