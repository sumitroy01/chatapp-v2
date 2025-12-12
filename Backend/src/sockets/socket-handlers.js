// server/socket-handlers.js
import Messages from "../models/message-models.js";
import Chats from "../models/chat-models.js";
import {
  getReceiverSocketIds,
  addUserSocket,
  removeUserSocket,
  getOnlineUsers,
  emitToRoom,
  emitToUser,
} from "./socket.js";

/**
 * attachSocketHandlers(io) - call from index.js after initSocket(server)
 */
export function attachSocketHandlers(io) {
  if (!io) throw new Error("Socket.IO instance required");

  io.on("connection", (socket) => {
    const sid = socket.id;
    const userId = socket.data?.userId || socket.handshake.query?.userId || null;

    console.log("socket connected:", sid, "userId:", userId);

    // Presence
    if (userId) addUserSocket(String(userId), sid);
    io.emit("getOnlineUsers", getOnlineUsers());

    // Join/leave rooms
    socket.on("join_room", (roomId) => {
      if (!roomId) return;
      socket.join(roomId);
    });

    socket.on("leave_room", (roomId) => {
      if (!roomId) return;
      socket.leave(roomId);
    });

    // send_message
    // payload: { chatId, content, messageType?, clientId?, receiver? }
    socket.on("send_message", async (payload = {}, ack) => {
      try {
        const senderId = socket.data?.userId;
        if (!senderId) return ack?.({ ok: false, error: "not_authenticated" });

        const { chatId, content, messageType = "text", clientId, receiver } = payload;
        if (!chatId) return ack?.({ ok: false, error: "chatId required" });
        if (messageType === "text" && !content) return ack?.({ ok: false, error: "content required" });

        const chat = await Chats.findById(chatId).select("allUsers isGroup");
        if (!chat) return ack?.({ ok: false, error: "chat_not_found" });

        let receiverId = receiver;
        if (!receiverId) {
          if (!chat.isGroup) {
            const other = (chat.allUsers || []).find((u) => String(u) !== String(senderId));
            receiverId = other || senderId;
          } else {
            receiverId = senderId;
          }
        }

        const created = await Messages.create({
          chat: chatId,
          content,
          sender: senderId,
          receiver: receiverId,
          readBy: [senderId],
          messageType,
        });

        const fullMessage = await Messages.findById(created._id)
          .populate("sender", "-password")
          .populate("chat");

        // best-effort update latestMessage
        Chats.findByIdAndUpdate(chatId, { latestMessage: fullMessage._id }).catch(() => {});

        // broadcast to room
        io.to(chatId).emit("message", { ...fullMessage.toObject(), clientId: clientId || null });

        // ensure receiver's direct sockets also get message
        const recipients = getReceiverSocketIds(String(receiverId));
        recipients.forEach((tsid) => {
          io.to(tsid).emit("message", { ...fullMessage.toObject(), clientId: clientId || null });
        });

        ack?.({ ok: true, messageId: created._id, clientId: clientId || null });
      } catch (err) {
        console.error("send_message error:", err);
        ack?.({ ok: false, error: "server_error" });
      }
    });

    // typing indicator
    socket.on("typing", (payload = {}) => {
      const { chatId, isTyping } = payload;
      if (!chatId) return;
      socket.to(chatId).emit("typing", { userId: socket.data?.userId, isTyping });
    });

    // mark_read
    socket.on("mark_read", async (payload = {}) => {
      try {
        const user = socket.data?.userId;
        if (!user) return;
        const { chatId, messageId } = payload;
        if (!chatId && !messageId) return;
        const filter = messageId ? { _id: messageId } : { chat: chatId };
        await Messages.updateMany(filter, { $addToSet: { readBy: user } });
        if (chatId) io.to(chatId).emit("messages_read", { chatId, by: user, messageId: messageId || null });
      } catch (err) {
        console.error("mark_read error:", err);
      }
    });

    // delete_message (optional)
    socket.on("delete_message", async (payload = {}, ack) => {
      try {
        const { messageId } = payload;
        if (!messageId) return ack?.({ ok: false, error: "messageId required" });
        const msg = await Messages.findById(messageId);
        if (!msg) return ack?.({ ok: false, error: "message_not_found" });
        if (String(msg.sender) !== String(socket.data?.userId)) return ack?.({ ok: false, error: "not_allowed" });

        await Messages.deleteOne({ _id: messageId });
        io.to(String(msg.chat)).emit("message_deleted", { messageId, chatId: msg.chat });
        ack?.({ ok: true });
      } catch (err) {
        console.error("delete_message error:", err);
        ack?.({ ok: false, error: "server_error" });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("socket disconnected:", sid, "userId:", userId, "reason:", reason);
      if (userId) removeUserSocket(String(userId), sid);
      io.emit("getOnlineUsers", getOnlineUsers());
    });
  });
}
