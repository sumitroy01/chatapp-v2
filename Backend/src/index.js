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

const allowedOrigins = [
  process.env.FRONTEND_URL,   // e.g. "https://donate-v2-jgkc.onrender.com"
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (e.g. curl, mobile) or if origin is in allowedOrigins
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
 allowedHeaders: [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Accept",
  "Cache-Control",
  "Origin"
],

};

// apply CORS globally
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));


// Middlewares
app.use(express.json());
app.use(cookieParser());




app.use("/api/auth/", authRoutes);
app.use("/api/message/", messageRoutes);
app.use("/api/user/", userRoutes);
app.use("/api/chat/", chatRoutes);

// Create http server and attach socket.io to it
const server = http.createServer(app);
const io = initSocket(server); // init socket with http server
attachSocketHandlers(io);

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
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
