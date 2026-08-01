module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      token: { type: DataTypes.STRING(500), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: { type: DataTypes.DATE },
      replaced_by_token: { type: DataTypes.STRING(500) },
    },
    { tableName: 'refresh_tokens', paranoid: false, updatedAt: false }
  );
  return RefreshToken;
};
