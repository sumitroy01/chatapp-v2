import { io } from "socket.io-client";

let socket = null;
const pendingRooms = new Set();

export const initSocket = (backendUrl, token) => {
  if (socket) return socket;

  socket = io(backendUrl, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    withCredentials: true,
    autoConnect: true,
    auth: { token },            // server reads socket.handshake.auth.token
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  socket.on("connect_error", (err) => console.error("socket connect_error", err));
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    // rejoin rooms after connect
    pendingRooms.forEach((roomId) => socket.emit("join_room", roomId));
  });
  socket.on("reconnect", (attempt) => {
    console.log("Socket reconnected after", attempt, "attempts");
    pendingRooms.forEach((roomId) => socket.emit("join_room", roomId));
  });
  socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));

  return socket;
};

export const getSocket = () => socket;
export const markJoinedRoom = (roomId) => pendingRooms.add(roomId);
export const markLeftRoom = (roomId) => pendingRooms.delete(roomId);
