const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');
const notificationService = require('../services/notification.service');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, cb) => cb(null, true),
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyAccessToken(token);
      const user = await User.findByPk(payload.sub);
      if (!user || !user.is_active) return next(new Error('unauthorized'));
      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (err) {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);
    socket.emit('connected', { message: 'Terhubung ke realtime server' });
  });

  notificationService.setSocketIo(io);
  return io;
};

const getIo = () => io;

module.exports = { initSocket, getIo };
