const ROLES = {
  SUPER_ADMIN: 'super_admin',
  MANAGER_GUDANG: 'manager_gudang',
  STAFF_GUDANG: 'staff_gudang',
  PURCHASING: 'purchasing',
  FINANCE: 'finance',
  VIEWER: 'viewer',
};

const ROLE_LIST = Object.values(ROLES);

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      password: { type: DataTypes.STRING(255), allowNull: false },
      role: {
        type: DataTypes.ENUM(...ROLE_LIST),
        allowNull: false,
        defaultValue: ROLES.VIEWER,
      },
      branch_id: { type: DataTypes.BIGINT.UNSIGNED },
      avatar: { type: DataTypes.STRING(255) },
      phone: { type: DataTypes.STRING(30) },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      last_login_at: { type: DataTypes.DATE },
    },
    {
      tableName: 'users',
      defaultScope: { attributes: { exclude: ['password'] } },
      scopes: { withPassword: { attributes: { include: ['password'] } } },
    }
  );
  return User;
};

module.exports.ROLES = ROLES;
module.exports.ROLE_LIST = ROLE_LIST;
