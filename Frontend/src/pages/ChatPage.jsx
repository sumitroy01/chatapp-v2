import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";


import authStore from "../store/auth.store.js";
import chatstore from "../store/chat.store.js";
import userstore from "../store/user.store.js";
import messageStore from "../store/message.store.js";

import ChatSidebar from "../components/chat/ChatSidebar.jsx";
import ChatWindow from "../components/chat/ChatWindow.jsx";
import CreateGroupModal from "../components/chat/CreateGroupModal.jsx";
import EditGroupModal from "../components/chat/EditGroupModal.jsx";

function ChatPage() {
  const { authUser } = authStore();
  const initialAttemptRef = useRef(false);

  const {
    chats,
    selectedChat,
    setSelectedChat,
    isFetchingChats,
    hasMore,
    page,
    limit,
    fetchChats,
    createGroupChat,
    accessChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
    isRenamingGroup,
    isUpdatingGroup,
    deleteChat,
    isDeletingChat,
  } = chatstore();

  const {
    messagesByChat,
    fetchMessages,
    sendMessage,
    isSendingMessage,
    isFetchingMessages,
    markAsRead,
  } = messageStore();

  const findUser = userstore((state) => state.findUser);
  const userFound = userstore((state) => state.userFound);
  const isSearchingUser = userstore((state) => state.isSearchingUser);

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [searchUserName, setSearchUserName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [isEditingGroup, setIsEditingGroup] = useState(false);

  // mobile: true = show sidebar, false = show chat window
  const [showSidebarOnMobile, setShowSidebarOnMobile] = useState(true);

  const activeMessagesEntry = selectedChat
    ? messagesByChat[selectedChat._id]
    : null;
  const messages = activeMessagesEntry?.data || [];

  // useEffect(() => {
  //   if (!chats.length && !isFetchingChats) {
  //     fetchChats(1, limit);
  //   }
  // }, [chats, isFetchingChats, fetchChats, limit]);
 useEffect(() => {
  if (chats.length === 0 && !isFetchingChats) {
    fetchChats(1, limit);
  }
}, [chats.length, fetchChats, limit]);



  useEffect(() => {
    if (selectedChat && !messagesByChat[selectedChat._id]) {
      fetchMessages({ chatId: selectedChat._id, page: 1, limit: 50 });
      if (authUser?._id) {
        markAsRead({ chatId: selectedChat._id, userId: authUser._id });
      }
    }
  }, [selectedChat, messagesByChat, fetchMessages, markAsRead, authUser]);

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, [chats]);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowSidebarOnMobile(false); // go to messages on mobile
  };

  const handleLoadMoreChats = () => {
    if (hasMore && !isFetchingChats) {
      fetchChats(page + 1, limit);
    }
  };

  const handleSendMessage = async (payload) => {
    if (payload?.content && typeof payload.content === "string") {
      if (!payload.content.trim()) return;
    }

    await messageStore.getState().sendMessage(payload);
  };

  const toggleUserInGroup = (user) => {
    const exists = selectedUsers.find((u) => u._id === user._id);
    if (exists) {
      setSelectedUsers((prev) => prev.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleCreateGroup = async ({ groupAvatar }) => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    const users = selectedUsers.map((u) => u._id);
    await createGroupChat({ name: groupName.trim(), users, groupAvatar });

    setIsCreatingGroup(false);
    setGroupName("");
    setSearchUserName("");
    setSelectedUsers([]);
  };

  const handleSelectChatFromUser = (user) => {
    if (!user) return;

    const existing = chats.find((chat) => {
      if (chat.isGroupChat || chat.isGroup) return false;
      const other = (chat.users || []).find((u) => u._id === user._id);
      return !!other;
    });

    if (existing) {
      setSelectedChat(existing);
      setShowSidebarOnMobile(false);
    } else if (accessChat) {
      accessChat(user._id);
      setShowSidebarOnMobile(false);
    } else {
      setSelectedChat(null);
    }
  };

  const handleOpenEditGroup = (chat) => {
    const target = chat || selectedChat;
    if (!target) return;

    const isGroup = target.isGroupChat || target.isGroup;
    if (!isGroup) return;

    setSelectedChat(target);
    setIsEditingGroup(true);
    setShowSidebarOnMobile(false);
  };

  const handleDeleteChat = (chat) => {
    const target = chat || selectedChat;
    if (!target?._id) return;

    deleteChat(target._id);

    if (selectedChat?._id === target._id) {
      setSelectedChat(null);
      setShowSidebarOnMobile(true);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] w-full max-w-6xl mx-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden flex flex-col shadow-2xl shadow-black/40">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 md:hidden">
        <button
          onClick={() => setShowSidebarOnMobile((prev) => !prev)}
          className="p-2 rounded-xl hover:bg-white/10 active:scale-95 transition"
        >
          <span className="sr-only">Toggle chat list</span>
          <div className="space-y-1">
            <span className="block w-5 h-0.5 bg-white" />
            <span className="block w-5 h-0.5 bg-white" />
            <span className="block w-5 h-0.5 bg-white" />
          </div>
        </button>

        <div className="text-xs font-medium text-white/80 truncate max-w-[60%]">
          {showSidebarOnMobile
            ? "Chats"
            : selectedChat?.chatName ||
              selectedChat?.groupName ||
              "Messages"}
        </div>

        <div className="w-8" />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            showSidebarOnMobile ? "flex" : "hidden"
          } md:flex w-full md:w-72 h-full`}
        >
          <ChatSidebar
            chats={sortedChats}
            selectedChat={selectedChat}
            onSelectChat={handleSelectChat}
            onLoadMore={handleLoadMoreChats}
            hasMore={hasMore}
            isFetchingChats={isFetchingChats}
            authUserId={authUser?._id}
            searchUserName={searchUserName}
            setSearchUserName={setSearchUserName}
            findUser={findUser}
            userFound={userFound}
            isSearchingUser={isSearchingUser}
            onUserClick={handleSelectChatFromUser}
            onOpenCreateGroup={() => setIsCreatingGroup(true)}
            onEditGroup={handleOpenEditGroup}
            onDeleteChat={handleDeleteChat}
          />
        </div>

        {/* Chat window */}
        <div
          className={`${
            showSidebarOnMobile ? "hidden" : "flex"
          } md:flex flex-1 h-full`}
        >
          <ChatWindow
            selectedChat={selectedChat}
            messages={messages}
            isFetchingMessages={isFetchingMessages}
            authUserId={authUser?._id}
            onSend={handleSendMessage}
            isSending={isSendingMessage}
            onEditGroup={handleOpenEditGroup}
            onDeleteChat={handleDeleteChat}
            isDeletingChat={isDeletingChat}
          />
        </div>
      </div>

      {isCreatingGroup && (
        <CreateGroupModal
          onClose={() => setIsCreatingGroup(false)}
          groupName={groupName}
          setGroupName={setGroupName}
          searchUserName={searchUserName}
          setSearchUserName={setSearchUserName}
          userFound={userFound}
          isSearchingUser={isSearchingUser}
          selectedUsers={selectedUsers}
          toggleUserInGroup={toggleUserInGroup}
          onCreate={handleCreateGroup}
          findUser={findUser}
        />
      )}

      {isEditingGroup && selectedChat && (
        <EditGroupModal
          onClose={() => setIsEditingGroup(false)}
          chat={selectedChat}
          authUserId={authUser?._id}
          searchUserName={searchUserName}
          setSearchUserName={setSearchUserName}
          userFound={userFound}
          isSearchingUser={isSearchingUser}
          findUser={findUser}
          renameGroup={renameGroup}
          addToGroup={addToGroup}
          removeFromGroup={removeFromGroup}
          isRenamingGroup={isRenamingGroup}
          isUpdatingGroup={isUpdatingGroup}
        />
      )}
    </div>
  );
}

export default ChatPage;
