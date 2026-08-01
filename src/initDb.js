const bcrypt = require('bcryptjs');
const db = require('./models');
const env = require('./config/env');
const logger = require('./utils/logger');

async function initDatabase() {
  await db.sequelize.authenticate();
  logger.info(`Koneksi database berhasil (${env.DB.dialect})`);

  const admin = await db.User.findOne({ where: { email: 'admin@company.com' } });
  if (!admin) {
    await db.User.create({
      name: 'Administrator Sistem',
      email: 'admin@company.com',
      password: await bcrypt.hash('Admin@123', 10),
      role: 'super_admin',
    });
    logger.info('Super admin dibuat: admin@company.com / Admin@123');
  }

  return db;
}

module.exports = { initDatabase };
