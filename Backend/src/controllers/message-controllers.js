// controllers/message-controller.js

import Messages from "../models/message-models.js";
import Chats from "../models/chat-models.js";
import { v2 as cloudinary } from "cloudinary";
// controllers/message-controller.js

export const getMessagesForChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50, sort = "asc" } = req.query; // 👈 change "desc" → "asc"

    if (!chatId) {
      return res.status(400).json({ message: "chatId required" });
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    const sortOrder = sort === "asc" ? 1 : -1;

    const messages = await Messages.find({ chat: chatId })
      .sort({ createdAt: sortOrder }) // asc -> oldest first
      .skip(skip)
      .limit(limitNum)
      .populate("sender", "-password")
      .populate("chat");

    return res.status(200).json({
      data: messages,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    console.error("error in getMessagesForChat:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const body = req.body || {};
    const {
      chatId,
      content,
      receiver: clientReceiver,
      messageType = "text",
    } = body;

    const senderId = req.user._id;

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required" });
    }

    if (messageType === "text" && !content) {
      return res
        .status(400)
        .json({ message: "content is required for text messages" });
    }

    const chat = await Chats.findById(chatId).select("allUsers isGroup");
    if (!chat) {
      return res.status(404).json({ message: "chat not found" });
    }

    let receiverId = clientReceiver;

    if (!receiverId) {
      if (!chat.isGroup) {
        const other = (chat.allUsers || []).find(
          (u) => String(u) !== String(senderId)
        );
        receiverId = other || senderId;
      } else {
        receiverId = senderId;
      }
    }

    let mediaUrl;
    let mediaPublicId;
    let mediaFormat;
    let mediaSize;

    if (req.file) {
      mediaUrl = req.file.path;
      mediaPublicId = req.file.filename;
      mediaFormat = req.file.format;
      mediaSize = req.file.bytes;
    }

    const created = await Messages.create({
      chat: chatId,
      content,
      sender: senderId,
      receiver: receiverId,
      readBy: [senderId],
      messageType,
      mediaUrl,
      mediaPublicId,
      mediaFormat,
      mediaSize,
    });

    let fullMessage = await Messages.findById(created._id)
      .populate("sender", "-password")
      .populate("chat");

    try {
      await Chats.findByIdAndUpdate(chatId, {
        latestMessage: fullMessage._id,
      });
    } catch (err) {
      console.log("failed to update latestMessage on chat:", err.message);
    }

    return res.status(201).json(fullMessage);
  } catch (err) {
    console.error("error in sendMessage:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
// PUT /api/message/read
export const markMessagesRead = async (req, res) => {
  try {
    const { chatId, messageId } = req.body;
    const userId = req.user._id;

    if (!chatId && !messageId) {
      return res
        .status(400)
        .json({ message: "chatId or messageId is required" });
    }

    const filter = messageId ? { _id: messageId } : { chat: chatId };

    await Messages.updateMany(filter, {
      $addToSet: { readBy: userId },
    });

    return res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    console.error("error in markMessagesRead:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/message/:messageId
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    if (!messageId) {
      return res.status(400).json({ message: "messageId required" });
    }

    const message = await Messages.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "message not found" });
    }

    // optional: check ownership
    if (String(message.sender) !== String(userId)) {
      return res.status(403).json({ message: "not allowed to delete" });
    }

    await Messages.deleteOne({ _id: messageId });

    return res.status(200).json({ message: "message deleted" });
  } catch (err) {
    console.error("error in deleteMessage:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/message/chat/:chatId
export const deleteChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!chatId) {
      return res.status(400).json({ message: "chatId required" });
    }

    await Messages.deleteMany({ chat: chatId });

    return res.status(200).json({ message: "chat messages deleted" });
  } catch (err) {
    console.error("error in deleteChatMessages:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
