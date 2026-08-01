const bcrypt = require('bcryptjs');
const { User, AuditLog } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { Op } = require('sequelize');

const index = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    role = '',
    is_active = '',
    sort_by = 'created_at',
    sort_dir = 'desc',
  } = req.query;

  const where = {};
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }
  if (role) where.role = role;
  if (is_active === 'true' || is_active === 'false') where.is_active = is_active === 'true';

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [{ association: 'branch', attributes: ['id', 'name'] }],
    order: [[sort_by, sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    limit: Math.min(Number(limit) || 20, 100),
    offset: (Number(page) - 1) * Number(limit),
  });

  const meta = {
    page: Number(page),
    limit: Number(limit),
    total: count,
    totalPages: Math.ceil(count / Number(limit)),
  };
  return ApiResponse.ok(res, rows, 'Daftar pengguna', meta);
});

const show = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    include: [{ association: 'branch', attributes: ['id', 'name'] }],
  });
  if (!user) throw ApiError.notFound('Pengguna tidak ditemukan');
  return ApiResponse.ok(res, user);
});

const create = asyncHandler(async (req, res) => {
  const { name, email, password, role, branch_id, phone } = req.body;

  const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
  if (exists) throw ApiError.conflict('Email sudah digunakan');

  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password: await bcrypt.hash(password, 10),
    role,
    branch_id: branch_id || null,
    phone,
  });

  await writeAudit({
    userId: req.user.id,
    action: 'create',
    entityType: 'user',
    entityId: user.id,
    after: { name, email, role },
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  return ApiResponse.created(res, user, 'Pengguna berhasil dibuat');
});

const update = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('Pengguna tidak ditemukan');

  const { name, email, role, branch_id, phone, is_active } = req.body;
  const before = user.toJSON();

  if (email && email.toLowerCase().trim() !== user.email) {
    const exists = await User.findOne({ where: { email: email.toLowerCase().trim() } });
    if (exists) throw ApiError.conflict('Email sudah digunakan');
    user.email = email.toLowerCase().trim();
  }
  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (branch_id !== undefined) user.branch_id = branch_id || null;
  if (phone !== undefined) user.phone = phone;
  if (is_active !== undefined) user.is_active = is_active;
  await user.save();

  await writeAudit({
    userId: req.user.id,
    action: 'update',
    entityType: 'user',
    entityId: user.id,
    before,
    after: user.toJSON(),
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  return ApiResponse.ok(res, user, 'Pengguna berhasil diperbarui');
});

const remove = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw ApiError.notFound('Pengguna tidak ditemukan');
  if (user.id === req.user.id) throw ApiError.badRequest('Tidak dapat menghapus akun sendiri');

  await user.destroy();
  await writeAudit({
    userId: req.user.id,
    action: 'delete',
    entityType: 'user',
    entityId: user.id,
    before: { name: user.name, email: user.email },
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  return ApiResponse.ok(res, null, 'Pengguna berhasil dihapus');
});

const activities = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.params.id;
  const { rows, count } = await AuditLog.findAndCountAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: Math.min(Number(limit) || 20, 100),
    offset: (Number(page) - 1) * Number(limit),
  });
  return ApiResponse.ok(res, rows, 'Riwayat aktivitas', {
    page: Number(page),
    limit: Number(limit),
    total: count,
    totalPages: Math.ceil(count / Number(limit)),
  });
});

module.exports = { index, show, create, update, remove, activities };
