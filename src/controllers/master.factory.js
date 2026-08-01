const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { buildListOptions, buildMeta } = require('../utils/listQuery');

const assertUnique = async (model, body, currentId, uniqueFields, label) => {
  for (const field of uniqueFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') continue;
    const where = { [field]: String(body[field]).trim() };
    if (currentId) where.id = { [require('sequelize').Op.ne]: currentId };
    const exists = await model.findOne({ where });
    if (exists) throw ApiError.conflict(`${field === 'name' ? 'Nama' : field.toUpperCase()} sudah digunakan`);
  }
};

const createMasterController = ({
  model,
  label,
  searchable = [],
  filterable = {},
  includes = [],
  uniqueFields = [],
  deleteGuards = [],
}) => {
  const index = asyncHandler(async (req, res) => {
    const options = buildListOptions({ query: req.query, searchable, filterable });
    const { rows, count } = await model.findAndCountAll({ ...options, include: includes });
    return ApiResponse.ok(res, rows, `Daftar ${label}`, buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
  });

  const listAll = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.is_active === 'true' || req.query.is_active === 'false') {
      where.is_active = req.query.is_active === 'true';
    }
    const rows = await model.findAll({ where, include: includes, order: [['id', 'ASC']], limit: 1000 });
    return ApiResponse.ok(res, rows, `Daftar ${label}`);
  });

  const show = asyncHandler(async (req, res) => {
    const row = await model.findByPk(req.params.id, { include: includes });
    if (!row) throw ApiError.notFound(`${label} tidak ditemukan`);
    return ApiResponse.ok(res, row);
  });

  const create = asyncHandler(async (req, res) => {
    await assertUnique(model, req.body, null, uniqueFields, label);
    const row = await model.create(req.body);
    await writeAudit({
      userId: req.user.id,
      action: 'create',
      entityType: model.name.toLowerCase(),
      entityId: row.id,
      after: req.body,
      ip: req.ip,
      ua: req.get('user-agent'),
    });
    return ApiResponse.created(res, row, `${label} berhasil dibuat`);
  });

  const update = asyncHandler(async (req, res) => {
    const row = await model.findByPk(req.params.id);
    if (!row) throw ApiError.notFound(`${label} tidak ditemukan`);
    await assertUnique(model, req.body, row.id, uniqueFields, label);

    const before = row.toJSON();
    await row.update(req.body);
    await writeAudit({
      userId: req.user.id,
      action: 'update',
      entityType: model.name.toLowerCase(),
      entityId: row.id,
      before,
      after: row.toJSON(),
      ip: req.ip,
      ua: req.get('user-agent'),
    });
    return ApiResponse.ok(res, row, `${label} berhasil diperbarui`);
  });

  const remove = asyncHandler(async (req, res) => {
    const row = await model.findByPk(req.params.id);
    if (!row) throw ApiError.notFound(`${label} tidak ditemukan`);

    for (const guard of deleteGuards) {
      const count = await guard.model.count({ where: { [guard.fk]: row.id } });
      if (count > 0) throw ApiError.conflict(`${label} tidak dapat dihapus karena masih dipakai ${count} ${guard.label}`);
    }

    await row.destroy();
    await writeAudit({
      userId: req.user.id,
      action: 'delete',
      entityType: model.name.toLowerCase(),
      entityId: row.id,
      before: row.toJSON(),
      ip: req.ip,
      ua: req.get('user-agent'),
    });
    return ApiResponse.ok(res, null, `${label} berhasil dihapus`);
  });

  return { index, listAll, show, create, update, remove };
};

module.exports = { createMasterController };
