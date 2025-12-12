import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function EditGroupModal({
  onClose,
  chat,
  authUserId,
  searchUserName,
  setSearchUserName,
  userFound,
  isSearchingUser,
  findUser,
  renameGroup,
  addToGroup,
  removeFromGroup,
  isRenamingGroup,
  isUpdatingGroup,
}) {
  const [name, setName] = useState(
    chat.chatName || chat.groupName || "Group chat"
  );
  const [groupAvatarPreview, setGroupAvatarPreview] = useState(
    chat.groupAvatar || ""
  );

  const users = chat.users || chat.allUsers || [];
  const admins = chat.admins || [];
  const isAdmin = admins.some((a) => String(a._id) === String(authUserId));

  useEffect(() => {
    setName(chat.chatName || chat.groupName || "Group chat");
    setGroupAvatarPreview(chat.groupAvatar || "");
  }, [chat]);

  // Save ONLY name
  const handleSaveName = () => {
    if (!name.trim()) return;
    renameGroup({ chatId: chat._id, name: name.trim() });
  };

  const handleSearch = () => {
    if (!searchUserName.trim()) return;
    findUser(searchUserName.trim());
  };

  const handleAddUser = () => {
    if (!userFound || !userFound._id) return;
    addToGroup({ chatId: chat._id, userId: userFound._id });
  };

  const handleRemoveUser = (userId) => {
    removeFromGroup({ chatId: chat._id, userId });
  };

  const handleLeaveGroup = () => {
    if (!authUserId) return;
    removeFromGroup({ chatId: chat._id, userId: authUserId });
    onClose();
  };

  // Auto-save avatar when changed
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGroupAvatarPreview(URL.createObjectURL(file));

    // auto-save only avatar, no need for name
    renameGroup({ chatId: chat._id, groupAvatar: file });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <motion.div
        className="w-full max-w-md rounded-3xl bg-slate-950 border border-white/10 p-4 shadow-2xl shadow-black/60"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Group settings</p>
          <button
            className="text-[11px] text-neutral-400 hover:text-neutral-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {/* Header: avatar + name */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center text-[12px] text-neutral-400">
              {groupAvatarPreview ? (
                <img
                  src={groupAvatarPreview}
                  alt="group"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {(chat.chatName || chat.groupName || "GC")[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex gap-2 items-center">
                <input
                  className="flex-1 bg-white/5 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-sky-500/60"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isAdmin}
                />
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isRenamingGroup || !name.trim()}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-[11px] disabled:opacity-60"
                  >
                    {isRenamingGroup ? "Saving..." : "Save"}
                  </button>
                )}
              </div>

              {isAdmin && (
                <label className="mt-1 inline-flex items-center gap-1 text-[10px] text-neutral-400 cursor-pointer hover:text-neutral-200">
                  <span className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10">
                    Change picture
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  {isRenamingGroup && (
                    <span className="text-[10px] text-sky-400">
                      Updating...
                    </span>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Members list */}
          <div>
            <p className="text-[11px] text-neutral-400 mb-1.5">Members</p>
            <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {users.map((u) => {
                const isYou = String(u._id) === String(authUserId);
                const isUserAdmin = admins.some(
                  (a) => String(a._id) === String(u._id)
                );

                const canRemove =
                  isAdmin && !isYou
                    ? true
                    : isYou && !isUserAdmin
                    ? true
                    : isYou;

                return (
                  <div
                    key={u._id}
                    className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-[10px] font-semibold">
                        {(u.userName || u.name || "?")[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[11px]">
                          {u.userName || u.name || "User"}
                          {isYou && " (you)"}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {isUserAdmin ? "Admin" : "Member"}
                        </p>
                      </div>
                    </div>
                    {canRemove && (
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(u._id)}
                        disabled={isUpdatingGroup}
                        className="text-[10px] px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-60"
                      >
                        {isYou ? "Leave" : "Remove"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add member */}
          {isAdmin && (
            <div className="space-y-2">
              <label className="text-[11px] text-neutral-400">
                Add member by username
              </label>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-white/5 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-sky-500/60 placeholder:text-neutral-500"
                  placeholder="Search user..."
                  value={searchUserName}
                  onChange={(e) => setSearchUserName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                <button
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs"
                  type="button"
                  onClick={handleSearch}
                >
                  {isSearchingUser ? "..." : "Find"}
                </button>
              </div>

              {userFound && (
                <button
                  type="button"
                  onClick={handleAddUser}
                  disabled={isUpdatingGroup}
                  className="w-full text-left text-xs bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 flex items-center justify-between disabled:opacity-60"
                >
                  <span>{userFound.userName || userFound.name}</span>
                  <span className="text-[11px] text-neutral-400">Add</span>
                </button>
              )}
            </div>
          )}

          {/* Leave group */}
          <button
            type="button"
            onClick={handleLeaveGroup}
            className="w-full mt-1 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-[11px] text-red-300"
          >
            Leave group
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default EditGroupModal;
