const { Notification } = require('../models');
const logger = require('../utils/logger');

let io = null;
const setSocketIo = (socketIo) => {
  io = socketIo;
};

const notifyUser = (userId, { type, title, message, data }) => {
  const dataStr = data ? JSON.stringify(data) : null;
  return Notification.create({ user_id: userId, type, title, message, data: dataStr }).then(
    (n) => {
      if (io && userId) io.to(`user:${userId}`).emit('notification:new', { id: n.id, type, title, message });
      return n;
    }
  );
};

const notifyRole = async (role, { type, title, message, data }) => {
  const { User } = require('../models');
  const users = await User.findAll({ where: { role, is_active: true }, attributes: ['id'] });
  const results = [];
  for (const u of users) results.push(await notifyUser(u.id, { type, title, message, data }));
  return results;
};

const notifyBroadcast = ({ type, title, message, data }) => {
  const dataStr = data ? JSON.stringify(data) : null;
  return Notification.create({ user_id: null, type, title, message, data: dataStr }).then((n) => {
    if (io) io.emit('notification:new', { id: n.id, type, title, message });
    return n;
  });
};

const markRead = (userId, id) =>
  Notification.update(
    { is_read: true, read_at: new Date() },
    { where: { id, user_id: userId } }
  );

module.exports = { setSocketIo, notifyUser, notifyRole, notifyBroadcast, markRead };
