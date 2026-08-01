const { StorageLocation, Product } = require('../models');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { writeAudit } = require('../services/audit.service');
const { buildListOptions, buildMeta } = require('../utils/listQuery');
const { Op } = require('sequelize');

const includes = [
  { association: 'warehouse', attributes: ['id', 'code', 'name'] },
  { association: 'parent', attributes: ['id', 'code', 'name', 'type'] },
];

const assertUnique = async ({ warehouse_id, code }, currentId) => {
  if (code === undefined) return;
  const where = { code, warehouse_id: warehouse_id ?? currentId };
  if (currentId) where.id = { [Op.ne]: currentId };
  const exists = await StorageLocation.findOne({ where });
  if (exists) throw ApiError.conflict('Kode lokasi sudah digunakan di gudang ini');
};

const index = asyncHandler(async (req, res) => {
  const options = buildListOptions({
    query: req.query,
    searchable: ['code', 'name'],
    filterable: { warehouse_id: 'number', type: 'string' },
  });
  const { rows, count } = await StorageLocation.findAndCountAll({ ...options, include: includes });
  return ApiResponse.ok(res, rows, 'Daftar lokasi', buildMeta({ total: count, page: options.meta.page, limit: options.meta.limit }));
});

const listAll = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.warehouse_id) where.warehouse_id = req.query.warehouse_id;
  const rows = await StorageLocation.findAll({ where, include: includes, order: [['id', 'ASC']], limit: 1000 });
  return ApiResponse.ok(res, rows, 'Daftar lokasi');
});

const show = asyncHandler(async (req, res) => {
  const row = await StorageLocation.findByPk(req.params.id, { include: includes });
  if (!row) throw ApiError.notFound('Lokasi tidak ditemukan');
  return ApiResponse.ok(res, row);
});

const create = asyncHandler(async (req, res) => {
  await assertUnique(req.body, null);
  const row = await StorageLocation.create(req.body);
  await writeAudit({
    userId: req.user.id,
    action: 'create',
    entityType: 'storagelocation',
    entityId: row.id,
    after: req.body,
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.created(res, row, 'Lokasi berhasil dibuat');
});

const update = asyncHandler(async (req, res) => {
  const row = await StorageLocation.findByPk(req.params.id);
  if (!row) throw ApiError.notFound('Lokasi tidak ditemukan');
  await assertUnique({ ...req.body, warehouse_id: req.body.warehouse_id ?? row.warehouse_id }, row.id);

  const before = row.toJSON();
  await row.update(req.body);
  await writeAudit({
    userId: req.user.id,
    action: 'update',
    entityType: 'storagelocation',
    entityId: row.id,
    before,
    after: row.toJSON(),
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, row, 'Lokasi berhasil diperbarui');
});

const remove = asyncHandler(async (req, res) => {
  const row = await StorageLocation.findByPk(req.params.id);
  if (!row) throw ApiError.notFound('Lokasi tidak ditemukan');

  const childCount = await StorageLocation.count({ where: { parent_id: row.id } });
  if (childCount > 0) throw ApiError.conflict('Lokasi tidak dapat dihapus karena memiliki sub-lokasi');
  const productCount = await Product.count({ where: { location_id: row.id } });
  if (productCount > 0) throw ApiError.conflict(`Lokasi tidak dapat dihapus karena berisi ${productCount} produk`);

  await row.destroy();
  await writeAudit({
    userId: req.user.id,
    action: 'delete',
    entityType: 'storagelocation',
    entityId: row.id,
    before: row.toJSON(),
    ip: req.ip,
    ua: req.get('user-agent'),
  });
  return ApiResponse.ok(res, null, 'Lokasi berhasil dihapus');
});

module.exports = { index, listAll, show, create, update, remove };
