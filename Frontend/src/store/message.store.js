// src/store/message.store.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const sortMessagesAsc = (msgs = []) =>
  [...msgs].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

const messageStore = create((set, get) => ({
  messagesByChat: {}, // { [chatId]: { data: [], page, limit, hasMore } }

  isSendingMessage: false,
  isFetchingMessages: false,
  isMarkingRead: false,
  isDeletingMessage: false,
  isDeletingChat: false,

  // FETCH MESSAGES
  fetchMessages: async ({ chatId, page = 1, limit = 50, sort = "asc" }) => {
    // 👈 default asc
    if (!chatId) {
      console.log("fetchMessages: chatId missing");
      return { success: false };
    }
    set({ isFetchingMessages: true });
    try {
      const res = await axiosInstance.get(`/api/message/${chatId}`, {
        params: { page, limit, sort },
      });

      const { data, page: resPage, limit: resLimit } = res.data || {};
      const hasMore = Array.isArray(data) && data.length === resLimit;

      set((state) => {
        const existing = state.messagesByChat[chatId] || { data: [] };

        const merged =
          resPage === 1
            ? data || []
            : [...(existing.data || []), ...(data || [])];

        const sorted = sortMessagesAsc(merged); // 👈 ensure correct order

        return {
          messagesByChat: {
            ...state.messagesByChat,
            [chatId]: {
              data: sorted,
              page: resPage,
              limit: resLimit,
              hasMore,
            },
          },
        };
      });

      return { success: true, data: res.data };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "could not fetch messages";
      console.log("error in fetchMessages store:", message);
      toast.error(message);
      return { success: false };
    } finally {
      set({ isFetchingMessages: false });
    }
  },

  // SEND MESSAGE
  sendMessage: async (payload) => {
    const isFormData = payload instanceof FormData;
    const chatId = isFormData ? payload.get("chatId") : payload?.chatId;

    if (!chatId) {
      toast.error("chatId is required");
      return { success: false };
    }

    set({ isSendingMessage: true });

    try {
      const config = isFormData
        ? {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        : undefined;

      const res = await axiosInstance.post("/api/message", payload, config);
      const newMessage = res.data;

      set((state) => {
        const existing = state.messagesByChat[chatId] || {
          data: [],
          page: 1,
          limit: 50,
          hasMore: true,
        };

        const merged = [...(existing.data || []), newMessage];
        const sorted = sortMessagesAsc(merged); // 👈 keep timeline consistent

        return {
          messagesByChat: {
            ...state.messagesByChat,
            [chatId]: {
              ...existing,
              data: sorted,
            },
          },
        };
      });

      return { success: true, message: newMessage };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "could not send message";
      console.log("error in sendMessage store:", message);
      toast.error(message);
      return { success: false };
    } finally {
      set({ isSendingMessage: false });
    }
  },

  // mark messages as read
  // params: { chatId?, messageId?, userId? }  -> userId for local readBy update
  // mark messages as read
  // params: { chatId?, messageId?, userId?, silent? }  -> userId for local readBy update
  markAsRead: async ({ chatId, messageId, userId, silent = false }) => {
    if (!chatId && !messageId) {
      console.log("markAsRead: chatId or messageId required");
      if (!silent) toast.error("invalid request");
      return { success: false };
    }

    set({ isMarkingRead: true });
    try {
      const body = {};
      if (chatId) body.chatId = chatId;
      if (messageId) body.messageId = messageId;

      const res = await axiosInstance.put("/api/message/read", body);

      // optimistic local update
      set((state) => {
        const updatedState = { ...state.messagesByChat };

        const addReadBy = (msg) => {
          if (!userId) return msg;
          const readBy = Array.isArray(msg.readBy)
            ? msg.readBy.map(String)
            : [];
          if (!readBy.includes(String(userId))) {
            return {
              ...msg,
              readBy: [...(msg.readBy || []), userId],
            };
          }
          return msg;
        };

        if (messageId) {
          Object.keys(updatedState).forEach((cId) => {
            const entry = updatedState[cId];
            if (!entry?.data) return;
            updatedState[cId] = {
              ...entry,
              data: entry.data.map((msg) =>
                String(msg._id) === String(messageId) ? addReadBy(msg) : msg
              ),
            };
          });
        } else if (chatId) {
          const entry = updatedState[chatId];
          if (entry?.data) {
            updatedState[chatId] = {
              ...entry,
              data: entry.data.map((msg) => addReadBy(msg)),
            };
          }
        }

        return { messagesByChat: updatedState };
      });

      // 🔇 no success toast when silent
      if (!silent && res.data?.message) {
        toast.success(res.data.message);
      }

      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "could not mark as read";
      console.log("error in markAsRead store:", message);
      if (!silent) toast.error(message);
      return { success: false };
    } finally {
      set({ isMarkingRead: false });
    }
  },

  // delete single message
  deleteMessage: async ({ messageId, chatId }) => {
    if (!messageId) {
      toast.error("messageId required");
      return { success: false };
    }

    set({ isDeletingMessage: true });
    try {
      const res = await axiosInstance.delete(`/api/message/${messageId}`);

      set((state) => {
        const updated = { ...state.messagesByChat };

        const updateChatMessages = (cId) => {
          const entry = updated[cId];
          if (!entry?.data) return;
          updated[cId] = {
            ...entry,
            data: entry.data.filter(
              (msg) => String(msg._id) !== String(messageId)
            ),
          };
        };

        if (chatId) {
          updateChatMessages(chatId);
        } else {
          Object.keys(updated).forEach(updateChatMessages);
        }

        return { messagesByChat: updated };
      });

      toast.success(res.data?.message || "message deleted");
      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "could not delete message";
      console.log("error in deleteMessage store:", message);
      toast.error(message);
      return { success: false };
    } finally {
      set({ isDeletingMessage: false });
    }
  },

  // delete a chat and its messages
  deleteChat: async (chatId) => {
    if (!chatId) {
      toast.error("chatId required");
      return { success: false };
    }

    set({ isDeletingChat: true });
    try {
      const res = await axiosInstance.delete(`/api/message/chat/${chatId}`);

      set((state) => {
        const updated = { ...state.messagesByChat };
        delete updated[chatId];
        return { messagesByChat: updated };
      });

      toast.success(res.data?.message || "chat deleted");
      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "could not delete chat";
      console.log("error in deleteChat store:", message);
      toast.error(message);
      return { success: false };
    } finally {
      set({ isDeletingChat: false });
    }
  },

  clearMessagesForChat: (chatId) => {
    if (!chatId) return;
    set((state) => {
      const updated = { ...state.messagesByChat };
      delete updated[chatId];
      return { messagesByChat: updated };
    });
  },

  clearAllMessages: () => {
    set({ messagesByChat: {} });
  },
}));

export default messageStore;
