const { Setting } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');

const index = asyncHandler(async (req, res) => {
  const rows = await Setting.findAll({ order: [['group', 'ASC'], ['key', 'ASC']] });
  const grouped = rows.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = {};
    acc[s.group][s.key] = s.value;
    return acc;
  }, {});
  return ApiResponse.ok(res, grouped, 'Pengaturan aplikasi');
});

const publicSettings = asyncHandler(async (req, res) => {
  const setting = await Setting.findOne({ where: { key: 'currency' } });
  return ApiResponse.ok(res, { currency: setting?.value || 'IDR' }, 'Pengaturan publik');
});

const meta = asyncHandler(async (req, res) => {
  const rows = await Setting.findAll({ order: [['group', 'ASC'], ['key', 'ASC']] });
  const grouped = rows.reduce((acc, s) => {
    if (!acc[s.group]) acc[s.group] = [];
    acc[s.group].push({ key: s.key, value: s.value, description: s.description });
    return acc;
  }, {});
  return ApiResponse.ok(res, grouped, 'Metadata pengaturan');
});

const update = asyncHandler(async (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
    throw ApiError.badRequest('Tidak ada pengaturan yang dikirim');
  }

  const updated = [];
  for (const [key, value] of Object.entries(payload)) {
    const setting = await Setting.findOne({ where: { key } });
    if (!setting) continue;
    setting.value = value == null ? null : String(value);
    await setting.save();
    updated.push(key);
  }

  await writeAudit({
    userId: req.user.id,
    action: 'update',
    entityType: 'setting',
    after: { keys: updated },
    ip: req.ip,
    ua: req.get('user-agent'),
  });

  return ApiResponse.ok(res, { updated }, 'Pengaturan berhasil disimpan');
});

module.exports = { index, meta, update, publicSettings };
