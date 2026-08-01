module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED },
      action: { type: DataTypes.STRING(50), allowNull: false },
      entity_type: { type: DataTypes.STRING(50), allowNull: false },
      entity_id: { type: DataTypes.STRING(50) },
      before_data: { type: DataTypes.TEXT },
      after_data: { type: DataTypes.TEXT },
      ip_address: { type: DataTypes.STRING(45) },
      user_agent: { type: DataTypes.STRING(255) },
    },
    {
      tableName: 'audit_logs',
      paranoid: false,
      updatedAt: false,
    }
  );
  return AuditLog;
};
