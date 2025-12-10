// src/utils/chat.utils.js
export function handleSelectChatFromUser(user, chats, setSelectedChat, accessChat) {
  if (!user) return;
  const existing = chats.find((chat) => {
    if (chat.isGroupChat) return false;
    const other = (chat.users || []).find((u) => u._id === user._id);
    return !!other;
  });

  if (existing) {
    setSelectedChat(existing);
  } else if (accessChat) {
    accessChat(user._id);
  } else {
    setSelectedChat(null);
  }
}
