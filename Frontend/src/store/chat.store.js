import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const normalizeChat = (chat) => {
  if (!chat) return chat;
  const isGroupChat = chat.isGroupChat ?? !!chat.isGroup;
  const users = chat.users || chat.allUsers || [];
  const chatName =
    chat.chatName ||
    chat.groupName ||
    (isGroupChat ? "Group chat" : chat.chatName);

  return {
    ...chat,
    isGroupChat,
    users,
    chatName,
  };
};

const chatstore = create((set, get) => ({
  chats: [],
  selectedChat: null,

  isFetchingChats: false,
  isAccessingChat: false,
  isCreatingGroup: false,
  isRenamingGroup: false,
  isUpdatingGroup: false,
  isDeletingChat: false,

  page: 1,
  limit: 50,
  hasMore: true,

  setSelectedChat: (chat) => {
    set({ selectedChat: normalizeChat(chat) });
  },

  fetchChats: async (page, limit) => {
    set({ isFetchingChats: true });
    try {
      const currentPage = page || get().page;
      const currentLimit = limit || get().limit;

      const res = await axiosInstance.get("/api/chat", {
        params: {
          page: currentPage,
          limit: currentLimit,
        },
      });

      const rawData = res.data?.data || [];
      const data = rawData.map(normalizeChat);

      const newPage = res.data?.page || currentPage;
      const newLimit = res.data?.limit || currentLimit;
      const prevChats = currentPage === 1 ? [] : get().chats;

      const merged = [...prevChats, ...data];

      set({
        chats: merged,
        page: newPage,
        limit: newLimit,
        hasMore: data.length === newLimit,
      });
    } catch (error) {
      console.log("error in fetchChats:", error?.response?.data || error);
      toast.error(
        error?.response?.data?.message || "failed to load chats"
      );
    } finally {
      set({ isFetchingChats: false });
    }
  },

  accessChat: async (userId) => {
    set({ isAccessingChat: true });
    try {
      const res = await axiosInstance.post("/api/chat/access", { userId });

      const chat = normalizeChat(res.data);
      const chats = get().chats || [];
      const exists = chats.find((c) => c._id === chat._id);

      const updatedChats = exists
        ? chats.map((c) => (c._id === chat._id ? chat : c))
        : [chat, ...chats];

      set({
        chats: updatedChats,
        selectedChat: chat,
      });
    } catch (error) {
      console.log("error in accessChat:", error?.response?.data || error);
      toast.error(
        error?.response?.data?.message || "failed to access chat"
      );
    } finally {
      set({ isAccessingChat: false });
    }
  },

  createGroupChat: async ({ name, users, groupAvatar }) => {
    set({ isCreatingGroup: true });
    try {
      let res;

      if (groupAvatar instanceof File) {
        const formData = new FormData();
        formData.append("name", name);
        users.forEach((id) => formData.append("users", id));
        formData.append("groupAvatar", groupAvatar);

        res = await axiosInstance.post("/api/chat/group", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        const payload = { name, users };
        if (groupAvatar) {
          payload.groupAvatar = groupAvatar;
        }

        res = await axiosInstance.post("/api/chat/group", payload);
      }

      const newChat = normalizeChat(res.data);
      const chats = get().chats || [];

      set({
        chats: [newChat, ...chats],
        selectedChat: newChat,
      });

      toast.success("group created sucessfully");
    } catch (error) {
      console.log(
        "error in createGroupChat:",
        error?.response?.data || error
      );
      toast.error(
        error?.response?.data?.message || "failed to create group"
      );
    } finally {
      set({ isCreatingGroup: false });
    }
  },

  renameGroup: async ({ chatId, name, groupAvatar }) => {
    set({ isRenamingGroup: true });
    try {
      let res;

      if (groupAvatar instanceof File) {
        const formData = new FormData();
        formData.append("chatId", chatId);
        if (name) {
          formData.append("name", name);
        }
        formData.append("groupAvatar", groupAvatar);

        res = await axiosInstance.put("/api/chat/rename", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        const payload = { chatId, name };
        if (groupAvatar) {
          payload.groupAvatar = groupAvatar;
        }

        res = await axiosInstance.put("/api/chat/rename", payload);
      }

      const updatedChat = normalizeChat(res.data);
      const chats = get().chats || [];
      const selectedChat = get().selectedChat;

      const updatedChats = chats.map((c) =>
        c._id === updatedChat._id ? updatedChat : c
      );

      const newSelected =
        selectedChat && selectedChat._id === updatedChat._id
          ? updatedChat
          : selectedChat;

      set({
        chats: updatedChats,
        selectedChat: newSelected,
      });

      toast.success("group renamed sucessfully");
    } catch (error) {
      console.log("error in renameGroup:", error?.response?.data || error);
      toast.error(
        error?.response?.data?.message || "failed to rename group"
      );
    } finally {
      set({ isRenamingGroup: false });
    }
  },

  addToGroup: async ({ chatId, userId }) => {
    set({ isUpdatingGroup: true });
    try {
      const res = await axiosInstance.put("/api/chat/add", {
        chatId,
        userId,
      });

      const updatedChat = normalizeChat(res.data);
      const chats = get().chats || [];
      const selectedChat = get().selectedChat;

      const updatedChats = chats.map((c) =>
        c._id === updatedChat._id ? updatedChat : c
      );

      const newSelected =
        selectedChat && selectedChat._id === updatedChat._id
          ? updatedChat
          : selectedChat;

      set({
        chats: updatedChats,
        selectedChat: newSelected,
      });

      toast.success("user added to group");
    } catch (error) {
      console.log("error in addToGroup:", error?.response?.data || error);
      toast.error(
        error?.response?.data?.message || "failed to add user"
      );
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  removeFromGroup: async ({ chatId, userId }) => {
    set({ isUpdatingGroup: true });
    try {
      const res = await axiosInstance.put("/api/chat/remove", {
        chatId,
        userId,
      });

      const data = res.data;
      const chats = get().chats || [];
      const selectedChat = get().selectedChat;

      if (data && data._id) {
        const updatedChat = normalizeChat(data);
        const updatedChats = chats.map((c) =>
          c._id === updatedChat._id ? updatedChat : c
        );

        const newSelected =
          selectedChat && selectedChat._id === updatedChat._id
            ? updatedChat
            : selectedChat;

        set({
          chats: updatedChats,
          selectedChat: newSelected,
        });
      } else {
        const filtered = chats.filter((c) => c._id !== chatId);
        const newSelected =
          selectedChat && selectedChat._id === chatId ? null : selectedChat;

        set({
          chats: filtered,
          selectedChat: newSelected,
        });
      }

      toast.success("user removed from group");
    } catch (error) {
      console.log(
        "error in removeFromGroup:",
        error?.response?.data || error
      );
      toast.error(
        error?.response?.data?.message || "failed to remove user"
      );
    } finally {
      set({ isUpdatingGroup: false });
    }
  },

  deleteChat: async (chatId) => {
    if (!chatId) return;
    set({ isDeletingChat: true });
    try {
      await axiosInstance.delete(`/api/chat/${chatId}`);

      const chats = get().chats || [];
      const selectedChat = get().selectedChat;

      const filtered = chats.filter((c) => c._id !== chatId);
      const newSelected =
        selectedChat && selectedChat._id === chatId ? null : selectedChat;

      set({
        chats: filtered,
        selectedChat: newSelected,
      });

      toast.success("chat deleted");
    } catch (error) {
      console.log("error in deleteChat:", error?.response?.data || error);
      toast.error(
        error?.response?.data?.message || "failed to delete chat"
      );
    } finally {
      set({ isDeletingChat: false });
    }
  },

}));

export default chatstore;
