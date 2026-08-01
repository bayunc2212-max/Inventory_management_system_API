const ApiError = require('../utils/ApiError');

const authorize =
  (...required) =>
  (req, res, next) => {
    const perms = req.permissions || [];
    const isSuper = perms.includes('*');
    const allowed = required.some((p) => perms.includes(p));
    if (isSuper || allowed) return next();
    return next(ApiError.forbidden('Anda tidak memiliki akses ke fitur ini'));
  };

module.exports = authorize;
