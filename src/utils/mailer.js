const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('./logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (env.MAIL.host) {
    transporter = nodemailer.createTransport({
      host: env.MAIL.host,
      port: env.MAIL.port,
      secure: env.MAIL.port === 465,
      auth: { user: env.MAIL.user, pass: env.MAIL.pass },
    });
  }
  return transporter;
}

/**
 * Kirim email. Jika SMTP tidak dikonfigurasi, log ke console (mode dev).
 */
async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    logger.info(`[MAIL dev-mode] to=${to} subject="${subject}"\n${text || html || ''}`);
    return { dev: true, to };
  }
  const info = await t.sendMail({ from: env.MAIL.from, to, subject, text, html });
  return info;
}

module.exports = { sendMail };
