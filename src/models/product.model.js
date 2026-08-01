module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(200), allowNull: false },
      sku: { type: DataTypes.STRING(60), allowNull: false, unique: true },
      barcode: { type: DataTypes.STRING(60), unique: true },
      qr_code: { type: DataTypes.STRING(120), unique: true },
      category_id: { type: DataTypes.BIGINT.UNSIGNED },
      brand_id: { type: DataTypes.BIGINT.UNSIGNED },
      unit: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pcs' },
      cost_price: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      selling_price: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      min_stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      max_stock: { type: DataTypes.INTEGER },
      current_stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      warehouse_id: { type: DataTypes.BIGINT.UNSIGNED },
      location_id: { type: DataTypes.BIGINT.UNSIGNED },
      weight: { type: DataTypes.DECIMAL(10, 2) },
      expired_at: { type: DataTypes.DATEONLY },
      description: { type: DataTypes.TEXT },
      image: { type: DataTypes.STRING(255) },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { tableName: 'products' }
  );
  return Product;
};
