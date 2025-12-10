import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";

import  conDb  from "./lib/db-lib.js";

import authRoutes from "./routes/auth-routes.js";
import chatRoutes from "./routes/chat-routes.js";
import messageRoutes from "./routes/message-routes.js";
import userRoutes from "./routes/user-routes.js";

const app = express();

const PORT = process.env.PORT;

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
console.log(process.env.FRONTEND_URL);

app.use("/api/auth/", authRoutes);
app.use("/api/message/", messageRoutes);
app.use("/api/user/", userRoutes);
app.use("/api/chat/", chatRoutes);

const startServer = async () => {
  try {
    await conDb();
    app.listen(PORT, () => {
      console.log(`app listening on port ${PORT}`);
    });
  } catch (error) {
    console.log("failed to start server", error?.message ?? error);
  }
};

startServer();
