// routes/message-routes.js
import express from "express";
import { protectRoute } from "../middleware/auth-middleware.js";
import {
  getMessagesForChat,
  sendMessage,
  markMessagesRead,
  deleteMessage,
  deleteChatMessages,
} from "../controllers/message-controllers.js";
import upload from "../middleware/upload-middleware.js";

const router = express.Router();

router.get("/:chatId", protectRoute, getMessagesForChat);

router.post("/", protectRoute, upload.single("media"), sendMessage);

router.put("/read", protectRoute, markMessagesRead);

router.delete("/:messageId", protectRoute, deleteMessage);

router.delete("/chat/:chatId", protectRoute, deleteChatMessages);

export default router;
