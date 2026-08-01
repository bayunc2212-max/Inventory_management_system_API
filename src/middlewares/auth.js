const { verifyAccessToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { User } = require('../models');
const { getPermissions } = require('../services/permissions');

const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) throw ApiError.unauthorized('Silakan login terlebih dahulu');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Sesi telah berakhir, silakan login ulang');
  }

  const user = await User.findByPk(payload.sub, {
    include: [{ association: 'branch', attributes: ['id', 'name'] }],
  });

  if (!user) throw ApiError.unauthorized('Pengguna tidak ditemukan');
  if (!user.is_active) throw ApiError.forbidden('Akun Anda dinonaktifkan');

  req.user = user;
  req.permissions = getPermissions(user.role);
  req.accessToken = token;
  next();
});

module.exports = auth;
