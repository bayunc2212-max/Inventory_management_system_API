const Joi = require('joi');
const { ROLE_LIST } = require('../models/user.model');

const idParam = Joi.object({
  id: Joi.number().integer().positive().required().messages({ 'any.required': 'id wajib diisi' }),
});

const createUser = Joi.object({
  name: Joi.string().max(150).required().messages({ 'any.required': 'Nama wajib diisi' }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email tidak valid',
    'any.required': 'Email wajib diisi',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password minimal 8 karakter',
    'any.required': 'Password wajib diisi',
  }),
  role: Joi.string()
    .valid(...ROLE_LIST)
    .required()
    .messages({ 'any.required': 'Role wajib diisi' }),
  branch_id: Joi.number().integer().positive().allow(null),
  phone: Joi.string().max(30).allow('', null),
});

const updateUser = Joi.object({
  name: Joi.string().max(150),
  email: Joi.string().email().messages({ 'string.email': 'Email tidak valid' }),
  role: Joi.string().valid(...ROLE_LIST),
  branch_id: Joi.number().integer().positive().allow(null),
  phone: Joi.string().max(30).allow('', null),
  is_active: Joi.boolean(),
});

module.exports = { idParam, createUser, updateUser };
