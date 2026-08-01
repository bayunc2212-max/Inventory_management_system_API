const crypto = require('crypto');

const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

const generateNumber = (prefix) => {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(
    d.getDate()
  ).padStart(2, '0')}`;
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${ymd}-${rand}`;
};

module.exports = { randomToken, generateNumber };
