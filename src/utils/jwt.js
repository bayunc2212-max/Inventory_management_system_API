const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signAccessToken = (payload) =>
  jwt.sign(payload, env.JWT.accessSecret, { expiresIn: env.JWT.accessExpires });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.JWT.refreshSecret, { expiresIn: env.JWT.refreshExpires });

const verifyAccessToken = (token) => jwt.verify(token, env.JWT.accessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, env.JWT.refreshSecret);

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
