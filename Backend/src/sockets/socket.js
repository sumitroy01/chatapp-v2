// server/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const userSocketMap = new Map(); // userId -> Set(socketId)
let io = null;

export function getReceiverSocketIds(userId) {
  const s = userSocketMap.get(String(userId));
  return s ? Array.from(s) : [];
}

export function getOnlineUsers() {
  return Array.from(userSocketMap.keys());
}

export function addUserSocket(userId, socketId) {
  if (!userId) return;
  const uid = String(userId);
  if (!userSocketMap.has(uid)) userSocketMap.set(uid, new Set());
  userSocketMap.get(uid).add(socketId);
}

export function removeUserSocket(userId, socketId) {
  if (!userId) return;
  const uid = String(userId);
  if (!userSocketMap.has(uid)) return;
  const set = userSocketMap.get(uid);
  set.delete(socketId);
  if (set.size === 0) userSocketMap.delete(uid);
}

export function initSocket(server, opts = {}) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  // small auth example: JWT in handshake.auth.token
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); // allow anonymous; change to error to require auth
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.userId = String(payload.id);
      socket.data.username = payload.username;
      return next();
    } catch (err) {
      // allow anonymous if token missing/invalid (or call next(new Error('Auth error')))
      return next();
    }
  });

  return io;
}

export function emitToUser(userId, event, payload) {
  const ids = getReceiverSocketIds(String(userId));
  if (!io) return;
  ids.forEach((sid) => io.to(sid).emit(event, payload));
}

export function emitToRoom(roomId, event, payload) {
  if (!io) return;
  io.to(roomId).emit(event, payload);
}

export function getIO() {
  return io;
}
