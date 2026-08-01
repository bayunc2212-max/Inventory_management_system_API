const http = require('http');
const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { initDatabase } = require('./initDb');
const { initSocket } = require('./sockets');

(async () => {
  try {
    await initDatabase();
  } catch (err) {
    logger.error('Gagal menghubungkan database. Pastikan MySQL DBngin berjalan:', err.message);
    process.exit(1);
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`API server berjalan di http://localhost:${env.PORT} (${env.NODE_ENV})`);
    logger.info(`Frontend: ${env.CLIENT_URL}`);
  });

  const shutdown = (signal) => {
    logger.info(`Menerima ${signal}, menutup server...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
