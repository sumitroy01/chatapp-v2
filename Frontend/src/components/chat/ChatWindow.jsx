// src/components/chat/ChatWindow.jsx
import { useState, useRef, useEffect } from "react";
import messageStore from "../../store/message.store.js";

function ChatWindow({
  selectedChat,
  messages,
  isFetchingMessages,
  authUserId,
  onSend,
  isSending,
  onEditGroup,
  onDeleteChat,
  isDeletingChat,
}) {
  const isGroupChat = selectedChat?.isGroupChat || selectedChat?.isGroup;

  const handleSend = async (payload) => {
    if (!selectedChat?._id) return;

    // media message (image / audio)
    if (payload.mediaFile) {
      const form = new FormData();
      form.append("chatId", selectedChat._id);

      if (payload.content) {
        form.append("content", payload.content);
      }
      if (payload.messageType) {
        form.append("messageType", payload.messageType);
      }
      if (payload.audioDuration != null) {
        form.append("audioDuration", String(payload.audioDuration));
      }

      form.append("media", payload.mediaFile);

      await onSend(form);
      return;
    }

    // text message
    const text = typeof payload.content === "string" ? payload.content.trim() : "";
    if (!text) return;

    await onSend({
      chatId: selectedChat._id,
      content: text,
      messageType: payload.messageType || "text",
    });
  };

  return (
    <section className="flex-1 flex flex-col bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      {selectedChat ? (
        <>
          <ChatHeader
            chat={selectedChat}
            isGroupChat={isGroupChat}
            authUserId={authUserId}
            onEditGroup={onEditGroup}
            onDeleteChat={onDeleteChat}
            isDeletingChat={isDeletingChat}
          />
          <ChatMessages
            messages={messages}
            isFetchingMessages={isFetchingMessages}
            authUserId={authUserId}
            chatId={selectedChat._id}
            isGroupChat={isGroupChat}
            selectedChat={selectedChat}
          />
          <ChatInput onSend={handleSend} isSending={isSending} />
        </>
      ) : (
        <EmptyChatState />
      )}
    </section>
  );
}

function ChatHeader({
  chat,
  isGroupChat,
  authUserId,
  onEditGroup,
  onDeleteChat,
  isDeletingChat,
}) {
  const otherUser =
    !isGroupChat && Array.isArray(chat?.users)
      ? chat.users.find((u) => String(u._id) !== String(authUserId))
      : null;

  const title = isGroupChat
    ? chat.chatName || chat.groupName || "Group"
    : otherUser?.name ||
      otherUser?.username ||
      otherUser?.email ||
      "Conversation";

  const subtitle = isGroupChat
    ? `${chat?.users?.length || 0} members`
    : "Direct message";

  const avatar = isGroupChat ? chat.groupAvatar : otherUser?.avatar;

  const avatarInitial = isGroupChat
    ? (chat.chatName || "G")[0].toUpperCase()
    : (otherUser?.name || otherUser?.email || "U")[0].toUpperCase();

  return (
    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-slate-950/70 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full overflow-hidden">
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              className="h-full w-full object-cover"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <div className="h-full w-full rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center text-xs font-semibold text-slate-950 shadow-md">
              {avatarInitial}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-sm font-semibold text-neutral-50">{title}</p>
          <p className="text-[11px] text-neutral-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isGroupChat && (
          <button
            type="button"
            className="text-[11px] px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition"
            onClick={() => onEditGroup?.(chat)}
          >
            Edit group
          </button>
        )}
        {onDeleteChat && (
          <button
            type="button"
            className="text-[11px] px-2.5 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/40 text-red-300 disabled:opacity-60 transition"
            onClick={() => {
              onDeleteChat?.(chat);
            }}
            disabled={isDeletingChat}
          >
            {isDeletingChat ? "Deleting..." : "Delete"}
          </button>
        )}
      </div>
    </div>
  );
}

function ChatMessages({
  messages,
  isFetchingMessages,
  authUserId,
  chatId,
  isGroupChat,
  selectedChat,
}) {
  const { markAsRead, deleteMessage } = messageStore();

  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [isUserNearBottom, setIsUserNearBottom] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const showEmptyState = !isFetchingMessages && messages.length === 0;

  const otherUser =
    !isGroupChat && Array.isArray(selectedChat?.users)
      ? selectedChat.users.find((u) => String(u._id) !== String(authUserId))
      : null;
  const otherUserId = otherUser?._id;

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const threshold = 80;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsUserNearBottom(distanceFromBottom < threshold);
  };

  useEffect(() => {
    if (!containerRef.current || !bottomRef.current) return;
    if (!isUserNearBottom) return;
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isUserNearBottom]);

  useEffect(() => {
    if (!chatId || !authUserId) return;
    if (!messages.length) return;
    if (!isUserNearBottom) return;

    markAsRead({ chatId, userId: authUserId, silent: true });
  }, [chatId, authUserId, messages.length, isUserNearBottom, markAsRead]);

  const normalizeId = (val) =>
    typeof val === "string" ? val : val?._id?.toString();

  const getMessageStatus = (msg) => {
    const readByIds = Array.isArray(msg.readBy)
      ? msg.readBy.map(normalizeId).filter(Boolean)
      : [];

    if (isGroupChat) {
      const senderId = normalizeId(msg.sender);
      const readers = readByIds.filter((id) => id !== senderId);
      return readers.length ? "read" : "sent";
    } else {
      const otherId = normalizeId(otherUserId);
      if (!otherId) return "sent";
      return readByIds.includes(otherId) ? "read" : "sent";
    }
  };

  const MessageTicks = ({ msg }) => {
    const status = getMessageStatus(msg);
    if (status === "read") {
      return <span className="text-[10px] text-white ml-1">✓✓</span>;
    }
    return <span className="text-[10px] text-white/60 ml-1">✓</span>;
  };

  const toggleMenu = (id) => {
    setActiveMenuId((prev) => (prev === id ? null : id));
  };

  const handleDelete = async (e, messageId) => {
    e.stopPropagation();
    await deleteMessage({ messageId, chatId });
    setActiveMenuId(null);
  };

  const renderMessageBody = (msg) => {
    const imageSrc =
      msg.mediaUrl || msg.imageUrl || msg.fileUrl || msg.url || msg.path;
    const audioSrc =
      msg.mediaUrl || msg.audioUrl || msg.fileUrl || msg.url || msg.path;

    if (msg.messageType === "image" && imageSrc) {
      return (
        <div className="space-y-1">
          <img
            src={imageSrc}
            alt="image"
            className="rounded-md max-w-full max-h-72 object-cover"
          />
          {msg.content && <p className="mt-1">{msg.content}</p>}
        </div>
      );
    }

    if (msg.messageType === "audio" && audioSrc) {
      return (
        <div className="space-y-1">
          <audio controls src={audioSrc} className="w-48 max-w-full" />
          {msg.content && <p className="mt-1">{msg.content}</p>}
        </div>
      );
    }

    return <p>{msg.content}</p>;
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-2
             [scrollbar-width:none]
             [&::-webkit-scrollbar]:hidden
             bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.10),_transparent_60%),radial-gradient(circle_at_bottom,_rgba(129,140,248,0.08),_transparent_55%)]"
    >
      {showEmptyState && (
        <div className="h-full flex items-center justify-center text-xs text-neutral-400">
          No messages yet. Say something.
        </div>
      )}

      {!isFetchingMessages &&
        messages.length > 0 &&
        messages.map((msg) => {
          const isMine =
            String(msg.sender?._id || msg.sender) === String(authUserId);

          return (
            <div
              key={msg._id}
              className={`relative flex w-full ${
                isMine ? "justify-end" : "justify-start"
              }`}
              onClick={() => isMine && toggleMenu(msg._id)}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed break-words whitespace-pre-wrap shadow-sm ${
                  isMine
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-white/5 text-neutral-50 rounded-bl-sm"
                }`}
              >
                {renderMessageBody(msg)}

                <p className="mt-1 text-[10px] text-white/70 text-right flex items-center justify-end">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {isMine && <MessageTicks msg={msg} />}
                </p>
              </div>

              {isMine && activeMenuId === msg._id && (
                <div
                  className="absolute -top-2 right-0 translate-y-[-100%] bg-slate-900 border border-slate-700 rounded-xl shadow-lg px-3 py-2 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => handleDelete(e, msg._id)}
                    className="text-[11px] text-red-400 hover:text-red-300"
                  >
                    Delete message
                  </button>
                </div>
              )}
            </div>
          );
        })}

      <div ref={bottomRef} />
    </div>
  );
}

function ChatInput({ onSend, isSending }) {
  const [value, setValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [imagePreview, setImagePreview] = useState(null); // { file, url }
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordStartRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    // if we have an image selected, send it with optional caption
    if (imagePreview?.file) {
      onSend({
        mediaFile: imagePreview.file,
        messageType: "image",
        content: value.trim() || "",
      });
      if (imagePreview.url) URL.revokeObjectURL(imagePreview.url);
      setImagePreview(null);
      setValue("");
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) return;

    onSend({ content: trimmed, messageType: "text" });
    setValue("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImagePreview({ file, url });

    e.target.value = "";
  };

  const clearImagePreview = () => {
    if (imagePreview?.url) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordStartRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const end = Date.now();
        const durationSec = Math.round((end - recordStartRef.current) / 1000);

        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const file = new File([blob], `voice-${Date.now()}.webm`, {
          type: "audio/webm",
        });

        onSend({
          mediaFile: file,
          messageType: "audio",
          audioDuration: durationSec,
        });

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("microphone error:", err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 border-t border-white/10 flex flex-col gap-2 bg-slate-950/80 backdrop-blur-md"
    >
      {imagePreview && (
        <div className="flex items-center gap-3 mb-1">
          <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-white/10">
            <img
              src={imagePreview.url}
              alt="preview"
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={clearImagePreview}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-slate-900/90 text-[10px] text-white flex items-center justify-center"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] text-neutral-400">
            Image ready to send. Add a caption or press Send.
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="cursor-pointer text-neutral-300 text-xl">
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />
          📷
        </label>

        <button
          type="button"
          onClick={handleToggleRecording}
          className={`text-xl ${
            isRecording ? "text-red-400 animate-pulse" : "text-neutral-300"
          }`}
        >
          {isRecording ? "⏹" : "🎤"}
        </button>

        <div className="flex-1 flex items-center rounded-2xl bg-white/5 px-3 py-2 focus-within:ring-1 focus-within:ring-emerald-500/70">
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-500 text-neutral-50"
            placeholder={
              isRecording ? "Recording voice note..." : "Type a message"
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isRecording}
          />
        </div>

        <button
          type="submit"
          disabled={isSending || isRecording}
          className="px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-slate-950 transition disabled:opacity-60"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}

function EmptyChatState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center textcenter px-6 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900">
      <div className="h-16 w-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
        <div className="h-8 w-8 rounded-2xl bg-emerald-500/80" />
      </div>
      <p className="text-sm font-medium text-neutral-50">
        No conversation selected
      </p>
      <p className="text-[11px] text-neutral-400 max-w-xs mt-1">
        Choose a chat from the left or start a new one to begin messaging.
      </p>
    </div>
  );
}

export default ChatWindow;
