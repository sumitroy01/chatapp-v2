import { useState } from "react";
import { motion } from "framer-motion";

function CreateGroupModal({
  onClose,
  groupName,
  setGroupName,
  searchUserName,
  setSearchUserName,
  userFound,
  isSearchingUser,
  selectedUsers,
  toggleUserInGroup,
  onCreate,
  findUser,
}) {
  const [groupAvatar, setGroupAvatar] = useState(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState("");

  const handleSearch = () => {
    const value = searchUserName.trim();
    if (!value) return;
    findUser(value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setGroupAvatar(file || null);
    if (file) {
      setGroupAvatarPreview(URL.createObjectURL(file));
    } else {
      setGroupAvatarPreview("");
    }
  };

  const handleCreateClick = () => {
    onCreate({ groupAvatar });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <motion.div
        className="w-full max-w-md rounded-3xl bg-slate-950 border border-white/10 p-4 shadow-2xl shadow-black/60"
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Create group</p>
          <button
            className="text-[11px] text-neutral-400 hover:text-neutral-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center text-[11px] text-neutral-400">
              {groupAvatarPreview ? (
                <img
                  src={groupAvatarPreview}
                  alt="group"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {(groupName || "GC")[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <label className="text-[11px] px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 cursor-pointer">
              <span>Choose picture</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          <div>
            <label className="text-[11px] text-neutral-400">Group name</label>
            <input
              className="mt-1 w-full bg-white/5 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-sky-500/60"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] text-neutral-400">
              Add members by username
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
                onClick={() => toggleUserInGroup(userFound)}
                className="w-full text-left text-xs bg-white/5 hover:bg-white/10 rounded-xl px-3 py-2 flex items-center justify-between"
              >
                <span>{userFound.userName || userFound.name}</span>
                <span className="text-[11px] text-neutral-400">
                  {selectedUsers.find((u) => u._id === userFound._id)
                    ? "Remove"
                    : "Add"}
                </span>
              </button>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedUsers.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => toggleUserInGroup(u)}
                  className="px-2 py-1 rounded-full bg-sky-500/10 border border-sky-500/40 text-[11px]"
                >
                  {u.userName || u.name}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateClick}
            className="w-full mt-2 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-slate-950 transition disabled:opacity-60"
            disabled={!groupName.trim() || selectedUsers.length === 0}
          >
            Create group
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default CreateGroupModal;
