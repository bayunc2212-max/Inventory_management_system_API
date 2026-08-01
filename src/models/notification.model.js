module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.BIGINT.UNSIGNED },
      type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'info' },
      title: { type: DataTypes.STRING(200), allowNull: false },
      message: { type: DataTypes.TEXT },
      data: { type: DataTypes.TEXT },
      is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      read_at: { type: DataTypes.DATE },
    },
    {
      tableName: 'notifications',
      paranoid: false,
      updatedAt: false,
    }
  );
  return Notification;
};
