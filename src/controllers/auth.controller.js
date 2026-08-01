const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, RefreshToken, PasswordResetToken } = require('../models');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { signAccessToken, signRefreshToken } = require('../utils/jwt');
const { randomToken } = require('../utils/helpers');
const { sendMail } = require('../utils/mailer');
const { writeAudit } = require('../services/audit.service');
const { getPermissions } = require('../services/permissions');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const refreshExpiryMs = () => {
  const match = env.JWT.refreshExpires.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const [, n, unit] = match;
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return Number(n) * mult;
};

const buildUserResponse = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  branch_id: user.branch_id,
  branch: user.branch,
  avatar: user.avatar,
  phone: user.phone,
  is_active: user.is_active,
  last_login_at: user.last_login_at,
  created_at: user.created_at,
  permissions: getPermissions(user.role),
});

const issueTokens = async (user) => {
  const refreshToken = randomToken(48);
  await RefreshToken.create({
    user_id: user.id,
    token: hashToken(refreshToken),
    expires_at: new Date(Date.now() + refreshExpiryMs()),
  });
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  return { accessToken, refreshToken };
};

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.scope('withPassword').findOne({
    where: { email: email.toLowerCase().trim() },
    include: [{ association: 'branch', attributes: ['id', 'name'] }],
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw ApiError.unauthorized('Email atau password salah');
  }
  if (!user.is_active) throw ApiError.forbidden('Akun Anda dinonaktifkan');

  const tokens = await issueTokens(user);
  await user.update({ last_login_at: new Date() });
  await writeAudit({
    userId: user.id,
    action: 'login',
    entityType: 'auth',
    entityId: user.id,
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  const fresh = await User.findByPk(user.id, {
    include: [{ association: 'branch', attributes: ['id', 'name'] }],
  });

  return ApiResponse.ok(res, { user: buildUserResponse(fresh), ...tokens }, 'Login berhasil');
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body || {};
  if (refreshToken) {
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { token: hashToken(refreshToken), revoked_at: null } }
    );
  }
  await writeAudit({
    userId: req.user?.id,
    action: 'logout',
    entityType: 'auth',
    entityId: req.user?.id,
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, null, 'Logout berhasil');
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const stored = await RefreshToken.findOne({
    where: { token: hashToken(refreshToken) },
    include: [{ association: 'user' }],
  });

  if (!stored || stored.revoked_at || stored.expires_at < new Date() || !stored.user) {
    throw ApiError.unauthorized('Refresh token tidak valid atau telah kedaluwarsa');
  }
  if (!stored.user.is_active) throw ApiError.forbidden('Akun Anda dinonaktifkan');

  const newRefresh = randomToken(48);
  await stored.update({
    revoked_at: new Date(),
    replaced_by_token: hashToken(newRefresh),
  });
  await RefreshToken.create({
    user_id: stored.user_id,
    token: hashToken(newRefresh),
    expires_at: new Date(Date.now() + refreshExpiryMs()),
  });

  const accessToken = signAccessToken({ sub: stored.user.id, role: stored.user.role });
  return ApiResponse.ok(res, { accessToken, refreshToken: newRefresh }, 'Token diperbarui');
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ where: { email: email.toLowerCase().trim() } });

  const token = randomToken(32);
  if (user) {
    await PasswordResetToken.create({
      user_id: user.id,
      token: hashToken(token),
      expires_at: new Date(Date.now() + 60 * 60 * 1000),
    });
    const link = `${env.CLIENT_URL}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Reset Password - System Inventory',
      html: `<p>Halo ${user.name},</p><p>Klik tautan berikut untuk mereset password Anda:</p><p><a href="${link}">${link}</a></p><p>Tautan berlaku 1 jam.</p>`,
    });
  }

  return ApiResponse.ok(res, null, 'Jika email terdaftar, tautan reset telah dikirim');
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const prt = await PasswordResetToken.findOne({ where: { token: hashToken(token) } });
  if (!prt || prt.used_at || prt.expires_at < new Date()) {
    throw ApiError.badRequest('Token reset tidak valid atau telah kedaluwarsa');
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.update({ password: hashed }, { where: { id: prt.user_id } });
  await prt.update({ used_at: new Date() });
  await RefreshToken.update({ revoked_at: new Date() }, { where: { user_id: prt.user_id, revoked_at: null } });

  return ApiResponse.ok(res, null, 'Password berhasil direset, silakan login');
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.scope('withPassword').findByPk(req.user.id);
  if (!(await bcrypt.compare(currentPassword, user.password))) {
    throw ApiError.badRequest('Password lama salah');
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  await RefreshToken.update({ revoked_at: new Date() }, { where: { user_id: user.id, revoked_at: null } });
  await writeAudit({
    userId: user.id,
    action: 'change_password',
    entityType: 'auth',
    entityId: user.id,
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  return ApiResponse.ok(res, null, 'Password berhasil diubah');
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    include: [{ association: 'branch', attributes: ['id', 'name', 'code'] }],
  });
  return ApiResponse.ok(res, buildUserResponse(user));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = req.user;
  await user.update({ name: name ?? user.name, phone: phone ?? user.phone, avatar: avatar ?? user.avatar });
  await writeAudit({
    userId: user.id,
    action: 'update_profile',
    entityType: 'user',
    entityId: user.id,
    after: { name, phone },
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, buildUserResponse(user), 'Profil berhasil diperbarui');
});

module.exports = {
  login,
  logout,
  refresh,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
  updateProfile,
};
