module.exports = (sequelize, DataTypes) => {
  const Warehouse = sequelize.define(
    'Warehouse',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      branch_id: { type: DataTypes.BIGINT.UNSIGNED },
      address: { type: DataTypes.TEXT },
      pic_name: { type: DataTypes.STRING(150) },
      phone: { type: DataTypes.STRING(30) },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'warehouses' }
  );
  return Warehouse;
};
