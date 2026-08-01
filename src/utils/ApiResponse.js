const ApiResponse = {
  ok(res, data = null, message = 'Sukses', meta = null, statusCode = 200) {
    const body = { success: true, message, data };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  },

  created(res, data = null, message = 'Berhasil dibuat') {
    return ApiResponse.ok(res, data, message, null, 201);
  },
};

module.exports = ApiResponse;
