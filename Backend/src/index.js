import express from "express";
import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";

import conDb from "./lib/db-lib.js";
import { initSocket } from "./sockets/socket.js";
import { attachSocketHandlers } from "./sockets/socket-handlers.js";

import authRoutes from "./routes/auth-routes.js";
import chatRoutes from "./routes/chat-routes.js";
import messageRoutes from "./routes/message-routes.js";
import userRoutes from "./routes/user-routes.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);


app.use("/api/auth/", authRoutes);
app.use("/api/message/", messageRoutes);
app.use("/api/user/", userRoutes);
app.use("/api/chat/", chatRoutes);

// Create http server and attach socket.io to it
const server = http.createServer(app);
const io = initSocket(server); // init socket with http server
attachSocketHandlers(io);

// Start server after DB connection
const PORT = process.env.PORT ;

const startServer = async () => {
  try {
    await conDb();
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.log("failed to start server", error?.message ?? error);
    process.exit(1);
  }
};

startServer();
