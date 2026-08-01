const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const fs = require('fs');
const path = require('path');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    try {
      const dir = path.resolve(__dirname, '../../logs');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(
        path.join(dir, 'error.log'),
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n${error.stack || error.message}\n\n`
      );
    } catch (_) {
      /* ignore */
    }
  }

  if (err instanceof ValidationError) {
    error = ApiError.unprocessable(
      'Data tidak valid',
      err.errors.map((e) => ({ field: e.path, message: e.message }))
    );
  }

  if (err instanceof UniqueConstraintError) {
    const fields = (err.errors || []).map((e) => e.path);
    error = ApiError.conflict(`Data sudah digunakan (${fields.join(', ')})`);
  }

  if (err instanceof ForeignKeyConstraintError) {
    error = ApiError.badRequest('Referensi data tidak valid atau data sedang digunakan');
  }

  if (!(error instanceof ApiError)) {
    logger.error('Unhandled error:', error);
    error = ApiError.internal();
  }

  const body = {
    success: false,
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
  };

  if (process.env.NODE_ENV === 'development' && error.stack) {
    body.stack = error.stack.split('\n').slice(0, 6).join(' ');
  }

  return res.status(error.statusCode).json(body);
};

module.exports = errorHandler;
