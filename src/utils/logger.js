const colors = { error: 91, warn: 93, info: 92, debug: 90 };

const pad = (n) => String(n).padStart(2, '0');
const ts = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const log = (level, ...args) => {
  const color = colors[level] || 37;
  console.log(`\x1b[${color}m[${ts()}] [${level.toUpperCase()}]\x1b[0m`, ...args);
};

const logger = {
  error: (...a) => log('error', ...a),
  warn: (...a) => log('warn', ...a),
  info: (...a) => log('info', ...a),
  debug: (...a) => {
    if (process.env.NODE_ENV !== 'production') log('debug', ...a);
  },
};

module.exports = logger;
