const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const models = {};
const basename = path.basename(__filename);

fs.readdirSync(__dirname)
  .filter((file) => file !== basename && file.endsWith('.model.js'))
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    models[model.name] = model;
  });

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') model.associate(models);
});

// ================= ASSOCIATIONS =================
const {
  Branch, User, Category, Brand, Supplier, Customer, Warehouse, StorageLocation,
  Product, RefreshToken, PasswordResetToken, PurchaseOrder, PurchaseOrderItem,
  GoodsReceipt, GoodsReceiptItem, ReceiptAttachment, StockIn, StockOut,
  StockTransfer, StockTransferItem, StockAdjustment, StockOpname, StockOpnameItem,
  StockMovement, Notification, AuditLog,
} = models;

// Branch
Branch.hasMany(User, { foreignKey: 'branch_id', as: 'users' });
Branch.hasMany(Warehouse, { foreignKey: 'branch_id', as: 'warehouses' });
User.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
Warehouse.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

// Category (self)
Category.hasMany(Category, { foreignKey: 'parent_id', as: 'children' });
Category.belongsTo(Category, { foreignKey: 'parent_id', as: 'parent' });

// StorageLocation (self)
StorageLocation.hasMany(StorageLocation, { foreignKey: 'parent_id', as: 'children' });
StorageLocation.belongsTo(StorageLocation, { foreignKey: 'parent_id', as: 'parent' });
Warehouse.hasMany(StorageLocation, { foreignKey: 'warehouse_id', as: 'locations' });
StorageLocation.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });

// Product
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Brand.hasMany(Product, { foreignKey: 'brand_id', as: 'products' });
Product.belongsTo(Brand, { foreignKey: 'brand_id', as: 'brand' });
Warehouse.hasMany(Product, { foreignKey: 'warehouse_id', as: 'products' });
Product.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
StorageLocation.hasMany(Product, { foreignKey: 'location_id', as: 'products' });
Product.belongsTo(StorageLocation, { foreignKey: 'location_id', as: 'location' });

// Auth tokens
User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', as: 'passwordResetTokens', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Purchase Order
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Warehouse.hasMany(PurchaseOrder, { foreignKey: 'warehouse_id', as: 'purchaseOrders' });
PurchaseOrder.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
User.hasMany(PurchaseOrder, { foreignKey: 'created_by', as: 'createdPurchaseOrders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
PurchaseOrder.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id', as: 'items', onDelete: 'CASCADE' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });
Product.hasMany(PurchaseOrderItem, { foreignKey: 'product_id', as: 'poItems' });
PurchaseOrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Goods Receipt
PurchaseOrder.hasMany(GoodsReceipt, { foreignKey: 'purchase_order_id', as: 'goodsReceipts' });
GoodsReceipt.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id', as: 'purchaseOrder' });
Supplier.hasMany(GoodsReceipt, { foreignKey: 'supplier_id', as: 'goodsReceipts' });
GoodsReceipt.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Warehouse.hasMany(GoodsReceipt, { foreignKey: 'warehouse_id', as: 'goodsReceipts' });
GoodsReceipt.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
User.hasMany(GoodsReceipt, { foreignKey: 'created_by', as: 'createdGoodsReceipts' });
GoodsReceipt.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
GoodsReceipt.hasMany(GoodsReceiptItem, { foreignKey: 'goods_receipt_id', as: 'items', onDelete: 'CASCADE' });
GoodsReceiptItem.belongsTo(GoodsReceipt, { foreignKey: 'goods_receipt_id', as: 'goodsReceipt' });
GoodsReceiptItem.belongsTo(PurchaseOrderItem, { foreignKey: 'purchase_order_item_id', as: 'poItem' });
Product.hasMany(GoodsReceiptItem, { foreignKey: 'product_id', as: 'grItems' });
GoodsReceiptItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
GoodsReceipt.hasMany(ReceiptAttachment, { foreignKey: 'goods_receipt_id', as: 'attachments', onDelete: 'CASCADE' });
ReceiptAttachment.belongsTo(GoodsReceipt, { foreignKey: 'goods_receipt_id', as: 'goodsReceipt' });
User.hasMany(ReceiptAttachment, { foreignKey: 'uploaded_by', as: 'uploadedAttachments' });
ReceiptAttachment.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// Stock In
Product.hasMany(StockIn, { foreignKey: 'product_id', as: 'stockIns' });
StockIn.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Warehouse.hasMany(StockIn, { foreignKey: 'warehouse_id', as: 'stockIns' });
StockIn.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
Supplier.hasMany(StockIn, { foreignKey: 'supplier_id', as: 'stockIns' });
StockIn.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
User.hasMany(StockIn, { foreignKey: 'created_by', as: 'createdStockIns' });
StockIn.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Stock Out
Product.hasMany(StockOut, { foreignKey: 'product_id', as: 'stockOuts' });
StockOut.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Warehouse.hasMany(StockOut, { foreignKey: 'warehouse_id', as: 'stockOuts' });
StockOut.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
User.hasMany(StockOut, { foreignKey: 'created_by', as: 'createdStockOuts' });
StockOut.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
StockOut.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Stock Transfer
Warehouse.hasMany(StockTransfer, { foreignKey: 'from_warehouse_id', as: 'outgoingTransfers' });
Warehouse.hasMany(StockTransfer, { foreignKey: 'to_warehouse_id', as: 'incomingTransfers' });
StockTransfer.belongsTo(Warehouse, { foreignKey: 'from_warehouse_id', as: 'fromWarehouse' });
StockTransfer.belongsTo(Warehouse, { foreignKey: 'to_warehouse_id', as: 'toWarehouse' });
User.hasMany(StockTransfer, { foreignKey: 'created_by', as: 'createdTransfers' });
StockTransfer.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
StockTransfer.belongsTo(User, { foreignKey: 'sent_by', as: 'sender' });
StockTransfer.belongsTo(User, { foreignKey: 'received_by', as: 'receiver' });
StockTransfer.hasMany(StockTransferItem, { foreignKey: 'stock_transfer_id', as: 'items', onDelete: 'CASCADE' });
StockTransferItem.belongsTo(StockTransfer, { foreignKey: 'stock_transfer_id', as: 'stockTransfer' });
Product.hasMany(StockTransferItem, { foreignKey: 'product_id', as: 'transferItems' });
StockTransferItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Stock Adjustment
Product.hasMany(StockAdjustment, { foreignKey: 'product_id', as: 'adjustments' });
StockAdjustment.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Warehouse.hasMany(StockAdjustment, { foreignKey: 'warehouse_id', as: 'adjustments' });
StockAdjustment.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
User.hasMany(StockAdjustment, { foreignKey: 'created_by', as: 'createdAdjustments' });
StockAdjustment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
StockAdjustment.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Stock Opname
Warehouse.hasMany(StockOpname, { foreignKey: 'warehouse_id', as: 'opnames' });
StockOpname.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
User.hasMany(StockOpname, { foreignKey: 'created_by', as: 'createdOpnames' });
StockOpname.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
StockOpname.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
StockOpname.hasMany(StockOpnameItem, { foreignKey: 'stock_opname_id', as: 'items', onDelete: 'CASCADE' });
StockOpnameItem.belongsTo(StockOpname, { foreignKey: 'stock_opname_id', as: 'stockOpname' });
Product.hasMany(StockOpnameItem, { foreignKey: 'product_id', as: 'opnameItems' });
StockOpnameItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Stock Movement (ledger)
Product.hasMany(StockMovement, { foreignKey: 'product_id', as: 'movements' });
StockMovement.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Warehouse.hasMany(StockMovement, { foreignKey: 'warehouse_id', as: 'movements' });
StockMovement.belongsTo(Warehouse, { foreignKey: 'warehouse_id', as: 'warehouse' });
User.hasMany(StockMovement, { foreignKey: 'created_by', as: 'createdMovements' });
StockMovement.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Audit Log
User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const db = { ...models, sequelize, Sequelize };

module.exports = db;
