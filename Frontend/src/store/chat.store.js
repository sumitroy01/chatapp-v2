import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
// chatstore file top
import { getSocket, markJoinedRoom, markLeftRoom } from "../socket.js"; // update path as needed


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
  const normalized = normalizeChat(chat);
  const prev = get().selectedChat;
  set({ selectedChat: normalized });

  try {
    const socket = getSocket();
    // leave previous room
    if (socket && prev && prev._id) {
      socket.emit("leave_room", prev._id);
      markLeftRoom(prev._id);
    }

    // join new room
    if (socket && normalized && normalized._id) {
      socket.emit("join_room", normalized._id);
      markJoinedRoom(normalized._id);
    }
  } catch (err) {
    console.warn("setSelectedChat: socket join/leave failed", err);
  }
},




  fetchChats: async (page, limit) => {
    // set fetching immediately
    set({ isFetchingChats: true });
    try {
      const currentPage = page || get().page;
      const currentLimit = limit || get().limit;

      const res = await axiosInstance.get("/api/chat", {
        params: {
          page: currentPage,
          limit: currentLimit,
        },
        // Accept 200 and 304 (so 304 ends up in `res`, not in `catch`)
        validateStatus: (status) => status === 200 || status === 304,
        // optional while debugging server caching - remove in prod if you want
        headers: { "Cache-Control": "no-cache" },
      });

      // If server returned 200, we got body; if 304, server says "no change"
      if (res.status === 200) {
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
      } else if (res.status === 304) {
        // No change on server. Important: do NOT throw — treat as successful no-op.
        // But update pagination flags so the UI doesn't keep retrying blindly.
        // Keep existing chats in store.
        const newPage = res.data?.page || currentPage;
        const newLimit = res.data?.limit || currentLimit;

        // Optionally: if page === 1 and we have zero chats client-side,
        // you might want to treat it as "no chats" (empty array).
        // Here we keep existing chats (likely empty) and update hasMore conservatively:
        set({
          page: newPage,
          limit: newLimit,
          // If server says no-change, assume no more pages for safety.
          // Adjust if your server provides better meta on 304 responses.
          hasMore: false,
        });

        // debug
        console.debug("fetchChats: 304 Not Modified - no changes applied");
      }
    } catch (error) {
      console.log("error in fetchChats:", error?.response?.data || error);
      toast.error(error?.response?.data?.message || "failed to load chats");
    } finally {
      // ALWAYS clear the fetching flag
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
      toast.error(error?.response?.data?.message || "failed to access chat");
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
      console.log("error in createGroupChat:", error?.response?.data || error);
      toast.error(error?.response?.data?.message || "failed to create group");
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
      toast.error(error?.response?.data?.message || "failed to rename group");
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
      toast.error(error?.response?.data?.message || "failed to add user");
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
      console.log("error in removeFromGroup:", error?.response?.data || error);
      toast.error(error?.response?.data?.message || "failed to remove user");
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
      toast.error(error?.response?.data?.message || "failed to delete chat");
    } finally {
      set({ isDeletingChat: false });
    }
  },
}));

export default chatstore;
