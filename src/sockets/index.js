const logger = require('../utils/logger');

function initSockets(io) {
  io.on('connection', (socket) => {
    logger.info('socket:connected', { id: socket.id });

    socket.on('join', (room) => {
      socket.join(room);
      logger.info('socket:join', { id: socket.id, room });
    });

    socket.on('message', (msg) => {
      logger.info('socket:message', { id: socket.id, msg });
      io.emit('message', msg);
    });

    socket.on('disconnect', () =>
      logger.info('socket:disconnect', { id: socket.id })
    );
  });
}

module.exports = initSockets;
