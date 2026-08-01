const Joi = require('joi');

const login = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email tidak valid',
    'any.required': 'Email wajib diisi',
  }),
  password: Joi.string().required().messages({ 'any.required': 'Password wajib diisi' }),
});

const refresh = Joi.object({
  refreshToken: Joi.string().required().messages({ 'any.required': 'refreshToken wajib diisi' }),
});

const forgotPassword = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email tidak valid',
    'any.required': 'Email wajib diisi',
  }),
});

const resetPassword = Joi.object({
  token: Joi.string().required().messages({ 'any.required': 'Token wajib diisi' }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password minimal 8 karakter',
    'any.required': 'Password wajib diisi',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Konfirmasi password tidak cocok',
    'any.required': 'Konfirmasi password wajib diisi',
  }),
});

const changePassword = Joi.object({
  currentPassword: Joi.string().required().messages({ 'any.required': 'Password lama wajib diisi' }),
  newPassword: Joi.string().min(8).required().messages({
    'string.min': 'Password baru minimal 8 karakter',
    'any.required': 'Password baru wajib diisi',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Konfirmasi password tidak cocok',
    'any.required': 'Konfirmasi password wajib diisi',
  }),
});

const updateProfile = Joi.object({
  name: Joi.string().max(150),
  phone: Joi.string().max(30).allow('', null),
  avatar: Joi.string().max(255).allow('', null),
});

module.exports = { login, refresh, forgotPassword, resetPassword, changePassword, updateProfile };
