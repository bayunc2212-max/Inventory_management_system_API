const { AuditLog } = require('../models');
const logger = require('../utils/logger');

/**
 * Mencatat aktivitas user ke audit log.
 * @param {object} opts
 * @param {number} [opts.userId]
 * @param {string} opts.action  - create | update | delete | login | approve | etc
 * @param {string} opts.entityType
 * @param {string|number} [opts.entityId]
 * @param {object} [opts.before]
 * @param {object} [opts.after]
 * @param {string} [opts.ip]
 * @param {string} [opts.ua]
 */
async function writeAudit(opts) {
  try {
    const { userId, action, entityType, entityId, before, after, ip, ua } = opts;
    await AuditLog.create({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId != null ? String(entityId) : null,
      before_data: before ? JSON.stringify(before) : null,
      after_data: after ? JSON.stringify(after) : null,
      ip_address: ip || null,
      user_agent: (ua || '').slice(0, 255) || null,
    });
  } catch (err) {
    logger.error('Gagal menulis audit log:', err.message);
  }
}

module.exports = { writeAudit };
