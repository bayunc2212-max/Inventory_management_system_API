module.exports = (sequelize, DataTypes) => {
  const StorageLocation = sequelize.define(
    'StorageLocation',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      warehouse_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      parent_id: { type: DataTypes.BIGINT.UNSIGNED },
      type: {
        type: DataTypes.ENUM('area', 'rack', 'shelf', 'bin'),
        allowNull: false,
        defaultValue: 'bin',
      },
      code: { type: DataTypes.STRING(50), allowNull: false },
      name: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.TEXT },
    },
    {
      tableName: 'storage_locations',
      indexes: [{ unique: true, fields: ['warehouse_id', 'code'] }],
    }
  );
  return StorageLocation;
};
