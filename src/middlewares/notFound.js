const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Rute tidak ditemukan: ${req.method} ${req.originalUrl}` });
};

module.exports = notFound;
