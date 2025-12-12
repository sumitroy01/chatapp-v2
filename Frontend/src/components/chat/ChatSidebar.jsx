import { useState } from "react";

function ChatSidebar({
  chats,
  selectedChat,
  onSelectChat,
  onLoadMore,
  hasMore,
  isFetchingChats,
  authUserId,
  searchUserName,
  setSearchUserName,
  findUser,
  userFound,
  isSearchingUser,
  onUserClick,
  onOpenCreateGroup,
  onEditGroup,
  onDeleteChat,
}) {
  // Hide found user if a 1:1 chat with them already exists
  const hasExistingChatWithFoundUser =
    userFound &&
    chats.some((chat) => {
      if (chat.isGroupChat || chat.isGroup) return false;
      const users = chat.users || chat.allUsers || [];
      return users.some((u) => u._id === userFound._id);
    });

  const effectiveUserFound = hasExistingChatWithFoundUser ? null : userFound;

  return (
    <aside className="w-full md:w-72 border-r border-white/10 flex flex-col bg-slate-950/60 backdrop-blur-xl">
      {/* New group button */}
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <button
          className="flex-1 text-xs bg-white/5 hover:bg-white/10 rounded-xl px-3 py-1.5 text-left focus:outline-none focus:ring-1 focus:ring-sky-500/60 transition"
          onClick={onOpenCreateGroup}
        >
          + New group
        </button>
      </div>

      {/* Search bar */}
      <div className="px-3 py-2">
        <SearchUserBar
          searchUserName={searchUserName}
          setSearchUserName={setSearchUserName}
          findUser={findUser}
          userFound={effectiveUserFound}
          isSearchingUser={isSearchingUser}
          onUserClick={onUserClick}
        />
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {isFetchingChats && !chats.length ? (
          <InitialLoadingState />
        ) : chats.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-neutral-400 px-4 text-center">
            No chats yet. Start a 1:1 or create a group to begin.
          </div>
        ) : (
          <ChatList
            chats={chats}
            selectedChat={selectedChat}
            onSelectChat={onSelectChat}
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            isFetchingChats={isFetchingChats}
            authUserId={authUserId}
            onEditGroup={onEditGroup}
            onDeleteChat={onDeleteChat}
          />
        )}
      </div>
    </aside>
  );
}

function SearchUserBar({
  searchUserName,
  setSearchUserName,
  findUser,
  userFound,
  isSearchingUser,
  onUserClick,
}) {
  const handleSearch = () => {
    if (!searchUserName.trim()) return;
    findUser(searchUserName.trim());
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className="flex-1 bg-white/5 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-sky-500/60 placeholder:text-neutral-500"
          placeholder="Search user by username"
          value={searchUserName}
          onChange={(e) => setSearchUserName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <button
          className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] transition"
          onClick={handleSearch}
        >
          {isSearchingUser ? "..." : "Go"}
        </button>
      </div>

      {userFound && (
        <button
          className="w-full text-left text-xs bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 flex items-center justify-between"
          onClick={() => {
            onUserClick(userFound); // open/create chat
            setSearchUserName(""); // clear search bar
          }}
        >
          <div>
            <p>{userFound.userName || userFound.name}</p>
            <p className="text-[10px] text-neutral-400">Open chat</p>
          </div>
        </button>
      )}
    </div>
  );
}

function ChatList({
  chats,
  selectedChat,
  onSelectChat,
  onLoadMore,
  hasMore,
  isFetchingChats,
  authUserId,
  onEditGroup,
  onDeleteChat,
}) {
  const [menuChatId, setMenuChatId] = useState(null);

  const closeMenu = () => setMenuChatId(null);

  return (
    <div className="py-2 space-y-1" onClick={closeMenu}>
      {chats.map((chat) => {
        const isActive = selectedChat?._id === chat._id;
        const isGroup = chat.isGroupChat || chat.isGroup;
        const users = chat.users || chat.allUsers || [];
        const otherUser =
          users.find((u) => u._id !== authUserId) || users[0] || {};
        const name =
          chat.chatName ||
          chat.groupName ||
          (isGroup
            ? "Group chat"
            : otherUser.userName || otherUser.name || "Chat");

        const showMenu = menuChatId === chat._id;

        return (
          <div
            key={chat._id}
            className={`relative w-full flex flex-col rounded-2xl px-2.5 py-1.5 transition group ${
              isActive
                ? "bg-white/10 border border-white/20"
                : "hover:bg-white/5"
            }`}
            onClick={() => {
              onSelectChat(chat);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuChatId(chat._id);
            }}
          >
            {/* <div className="flex items-center gap-2 w-full">
              <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-[11px] font-semibold overflow-hidden shadow-sm shadow-black/40">
                {isGroup ? (
                  "G"
                ) : otherUser.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.userName || otherUser.name || "User"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  name?.[0]?.toUpperCase()
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-white">
                  {name}
                </p>

                {chat.latestMessage?.content && (
                  <p className="text-[10px] text-neutral-400 truncate">
                    {chat.latestMessage.content}
                  </p>
                )}
              </div>
            </div> */}
            <div className="flex items-center gap-2 w-full">
              <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-[11px] font-semibold overflow-hidden shadow-sm shadow-black/40">
                {(() => {
                  const isGroup = chat.isGroupChat || chat.isGroup;
                  const avatar = isGroup ? chat.groupAvatar : otherUser?.avatar;

                  // group initials or user initials
                  const initials = isGroup
                    ? (
                        (chat.chatName || chat.groupName || "Group")[0] || "G"
                      ).toUpperCase()
                    : (
                        (otherUser?.userName || otherUser?.name || "U")[0] ||
                        "U"
                      ).toUpperCase();

                  if (avatar) {
                    return (
                      <img
                        src={avatar}
                        alt={name}
                        className="h-full w-full object-cover"
                        onError={(e) =>
                          (e.currentTarget.style.display = "none")
                        }
                      />
                    );
                  }

                  return initials;
                })()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-white">
                  {name}
                </p>

                {chat.latestMessage?.content && (
                  <p className="text-[10px] text-neutral-400 truncate">
                    {chat.latestMessage.content}
                  </p>
                )}
              </div>
            </div>

            {showMenu && (
              <div
                className="absolute right-1 top-8 z-20 bg-slate-950/95 border border-white/10 rounded-xl shadow-xl shadow-black/50 text-[11px] py-1 min-w-[130px]"
                onClick={(e) => e.stopPropagation()}
              >
                {isGroup && (
                  <button
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/5 transition"
                    onClick={() => {
                      onEditGroup?.(chat);
                      closeMenu();
                    }}
                  >
                    <span>Edit group</span>
                    <span className="text-[9px] opacity-60">✏️</span>
                  </button>
                )}
                <button
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-red-500/15 text-red-300 transition"
                  onClick={() => {
                    onDeleteChat?.(chat);
                    closeMenu();
                  }}
                >
                  <span>Delete chat</span>
                  <span className="text-[9px] opacity-60">🗑</span>
                </button>
              </div>
            )}
          </div>
        );
      })}

      {hasMore && (
        <button
          className="w-full flex items-center justify-center gap-2 text-center text-[11px] text-neutral-400 py-1.5 hover:text-neutral-200"
          onClick={onLoadMore}
          disabled={isFetchingChats}
        >
          {isFetchingChats ? (
            <>
              <span>Loading more</span>
              <span className="h-3 w-3 rounded-full border border-white/40 border-t-white/80 animate-spin" />
            </>
          ) : (
            "Load more"
          )}
        </button>
      )}
    </div>
  );
}

function InitialLoadingState() {
  return (
    <div className="h-full flex items-center justify-center text-xs text-neutral-400">
      <div className="flex items-center gap-2">
        <span>Loading chats</span>
        <div className="flex gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.2s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce [animation-delay:-0.1s]" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/70 animate-bounce" />
        </div>
      </div>
    </div>
  );
}

export default ChatSidebar;
