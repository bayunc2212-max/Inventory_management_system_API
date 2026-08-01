const { AuditLog, sequelize } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { Op } = require('sequelize');

const index = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', action = '', entity_type = '', user_id = '', start_date = '', end_date = '' } = req.query;

  const where = {};
  if (action) where.action = action;
  if (entity_type) where.entity_type = entity_type;
  if (user_id) where.user_id = user_id;

  if (start_date || end_date) {
    const createdAt = {};
    if (start_date) createdAt[Op.gte] = new Date(`${start_date}T00:00:00`);
    if (end_date) createdAt[Op.lte] = new Date(`${end_date}T23:59:59`);
    where.created_at = createdAt;
  }

  if (search) {
    where[Op.and] = [
      {
        [Op.or]: [
          { action: { [Op.like]: `%${search}%` } },
          { entity_type: { [Op.like]: `%${search}%` } },
          { ip_address: { [Op.like]: `%${search}%` } },
          {
            user_id: {
              [Op.in]: sequelize.literal(
                `(SELECT id FROM users WHERE name LIKE '%${search.replace(/'/g, "''")}%' OR email LIKE '%${search.replace(/'/g, "''")}%')`
              ),
            },
          },
        ],
      },
    ];
  }

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include: [{ association: 'user', attributes: ['id', 'name', 'email'] }],
    order: [['created_at', 'DESC']],
    limit: Math.min(Number(limit) || 20, 100),
    offset: (Number(page) - 1) * Number(limit),
  });

  return ApiResponse.ok(res, rows, 'Daftar log aktivitas', {
    page: Number(page),
    limit: Number(limit),
    total: count,
    totalPages: Math.ceil(count / Number(limit)),
  });
});

const actions = asyncHandler(async (req, res) => {
  const rows = await AuditLog.findAll({ attributes: ['action'], group: ['action'], raw: true });
  const entityTypes = await AuditLog.findAll({ attributes: ['entity_type'], group: ['entity_type'], raw: true });
  return ApiResponse.ok(res, {
    actions: rows.map((r) => r.action).filter(Boolean),
    entityTypes: entityTypes.map((r) => r.entity_type).filter(Boolean),
  });
});

module.exports = { index, actions };
