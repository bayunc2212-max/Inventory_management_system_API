module.exports = (sequelize, DataTypes) => {
  const PasswordResetToken = sequelize.define(
    'PasswordResetToken',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      token: { type: DataTypes.STRING(500), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: { type: DataTypes.DATE },
    },
    { tableName: 'password_reset_tokens', paranoid: false, updatedAt: false }
  );
  return PasswordResetToken;
};
