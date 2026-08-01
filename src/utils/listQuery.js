const { Op } = require('sequelize');

const buildListOptions = ({ query, searchable = [], filterable = {} }) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    sort_by = 'id',
    sort_dir = 'desc',
    ...rest
  } = query;

  const where = {};
  if (search && searchable.length > 0) {
    where[Op.or] = searchable.map((field) => ({ [field]: { [Op.like]: `%${search}%` } }));
  }
  Object.entries(filterable).forEach(([field, config]) => {
    const value = rest[field];
    if (value === undefined || value === '') return;
    if (config === 'boolean') {
      if (value === 'true' || value === 'false') where[field] = value === 'true';
      return;
    }
    if (typeof config === 'function') {
      const r = config(value, where);
      if (r) where[field] = r;
      return;
    }
    where[field] = value;
  });

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Number(limit) || 20, 100);

  return {
    where,
    limit: limitNum,
    offset: (pageNum - 1) * limitNum,
    order: [[sort_by, sort_dir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    meta: {
      page: pageNum,
      limit: limitNum,
      total: 0,
      totalPages: 0,
    },
  };
};

const buildMeta = ({ total, page, limit }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = { buildListOptions, buildMeta };
