// src/lib/socket-listeners.js
import { getSocket } from "../socket.js"; // path to your socket helper
import chatstore from "../store/chat.store"; // path to chatstore file
import messageStore from "../store/message.store"; // path to message store

let registered = false;

export function registerSocketListeners() {
  if (registered) return;
  registered = true;

  const socket = getSocket();
  if (!socket) {
    console.warn("registerSocketListeners: socket not initialized");
    return;
  }

  // incoming chat message (server emits "message")
  socket.on("message", (msg) => {
    try {
      // msg should include chat id in msg.chat or msg.chat._id depending on server payload
      const chatId = (msg.chat && (msg.chat._id || msg.chat)) || msg.chatId || msg.chat;
      if (!chatId) {
        console.warn("socket message missing chat id", msg);
        return;
      }
      // push into message store
      messageStore.getState().addIncomingMessage(String(chatId), msg);

      // if chat list needs to update latest message preview, update chatstore
      const chats = chatstore.getState().chats || [];
      const chatExists = chats.some((c) => String(c._id) === String(chatId));
      if (chatExists) {
        // update latestMessage on that chat
        const updatedChats = chats.map((c) =>
          String(c._id) === String(chatId) ? { ...c, latestMessage: msg } : c
        );
        chatstore.setState({ chats: updatedChats });
      } else {
        // optional: fetch chats or prepend new chat if server emits a newChat event
      }
    } catch (err) {
      console.error("socket message handler error", err);
    }
  });

  // message deleted
  socket.on("message_deleted", (payload) => {
    try {
      const { messageId, chatId } = payload || {};
      if (chatId && messageId) {
        messageStore.getState().deleteMessage({ messageId, chatId });
      }
    } catch (err) {
      console.error("socket message_deleted handler", err);
    }
  });

  // messages_read
  socket.on("messages_read", (payload) => {
    try {
      const { chatId, by, messageId } = payload || {};
      if (!chatId) return;
      // local optimistic update: add 'by' to readBy for appropriate messages
      messageStore.getState().markAsRead({ chatId, messageId, userId: by, silent: true });
    } catch (err) {
      console.error("socket messages_read handler", err);
    }
  });

  // online users update (if you use it)
  socket.on("getOnlineUsers", (usersArray) => {
    // optionally save to some presence store or UI
    console.debug("online users:", usersArray);
  });

  // if server emits 'newChat' for chats created for the user, handle it
  socket.on("newChat", (chat) => {
    try {
      if (!chat) return;
      const normalized = chatstore.getState().setSelectedChat ? chatstore.getState().setSelectedChat : null;
      // simpler: just prepend to chat list
      const chats = chatstore.getState().chats || [];
      const exists = chats.some((c) => String(c._id) === String(chat._id));
      if (!exists) {
        chatstore.setState({ chats: [chat, ...chats] });
      }
    } catch (err) {
      console.error("socket newChat handler", err);
    }
  });
}
