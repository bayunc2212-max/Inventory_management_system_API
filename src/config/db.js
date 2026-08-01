const path = require('path');
const { Sequelize } = require('sequelize');
const env = require('./env');

const isSqlite = env.DB.dialect === 'sqlite';
const storagePath = path.resolve(__dirname, '../data/inventory.db');

const sequelize = new Sequelize(env.DB.name, env.DB.user, env.DB.password, {
  dialect: env.DB.dialect,
  host: env.DB.host,
  port: env.DB.port,
  storage: isSqlite ? (env.DB.storage || storagePath) : undefined,
  logging: env.DB.logging ? console.log : false,
  define: {
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    paranoid: true,
    freezeTableName: false,
    timestamps: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

if (isSqlite) {
  const fs = require('fs');
  const dir = path.dirname(storagePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

module.exports = sequelize;
