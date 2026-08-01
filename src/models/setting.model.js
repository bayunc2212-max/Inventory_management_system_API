module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define(
    'Setting',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      value: { type: DataTypes.TEXT },
      group: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'general' },
      description: { type: DataTypes.STRING(255) },
    },
    { tableName: 'settings', paranoid: false, createdAt: false }
  );
  return Setting;
};
