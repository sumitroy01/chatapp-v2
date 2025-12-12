// socket.js
import { io } from "socket.io-client";

let socket;

export const initSocket = (backendUrl) => {
  if (socket) return socket;
  socket = io(backendUrl, {
    path: "/socket.io",             // default, set explicitly if changed on server
    transports: ["websocket", "polling"],
    withCredentials: true,         // MUST for cookies to be sent on the handshake
    autoConnect: true,
  });

  socket.on("connect_error", (err) => {
    console.error("socket connect_error", err);
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const getSocket = () => socket;
