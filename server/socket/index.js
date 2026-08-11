const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initSocket = (io) => {
  // JWT authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('Authentication error: user not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;

    // Auto-join household room
    if (user.householdId) {
      const room = user.householdId.toString();
      socket.join(room);
      console.log(`[Socket] ${user.name} joined room ${room}`);
    }

    socket.on('join:household', (householdId) => {
      socket.join(householdId);
      console.log(`[Socket] ${user.name} manually joined room ${householdId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] ${user.name} disconnected`);
    });
  });

  // Export helper to emit from controllers
  return io;
};

/*
  Events emitted from controllers (server → room):
  ─────────────────────────────────────────────────
  expense:added     { expense }
  expense:updated   { expense }
  expense:deleted   { expenseId }
  settlement:paid   { settlement }
  member:joined     { member }
  member:removed    { memberId }
  balance:updated   { balances }
*/

module.exports = { initSocket };
