const { Branch } = require('../models');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

const listAll = asyncHandler(async (req, res) => {
  const rows = await Branch.findAll({ order: [['name', 'ASC']], limit: 100 });
  return ApiResponse.ok(res, rows, 'Daftar cabang');
});

module.exports = { listAll };
