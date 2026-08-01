module.exports = (sequelize, DataTypes) => {
  const ReceiptAttachment = sequelize.define(
    'ReceiptAttachment',
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      goods_receipt_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      file_path: { type: DataTypes.STRING(255), allowNull: false },
      file_name: { type: DataTypes.STRING(255), allowNull: false },
      mime_type: { type: DataTypes.STRING(100) },
      uploaded_by: { type: DataTypes.BIGINT.UNSIGNED },
    },
    { tableName: 'receipt_attachments', paranoid: false, updatedAt: false }
  );
  return ReceiptAttachment;
};
