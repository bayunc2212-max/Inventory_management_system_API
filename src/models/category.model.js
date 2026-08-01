module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      code: { type: DataTypes.STRING(50) },
      parent_id: { type: DataTypes.BIGINT.UNSIGNED },
      description: { type: DataTypes.TEXT },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'categories' }
  );
  return Category;
};
