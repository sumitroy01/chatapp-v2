import { useEffect, useState } from "react";
import { motion } from "framer-motion";

function ProfileForm({ effectiveUser, updateProfile, isUpdatingProfile }) {
  const [name, setName] = useState(effectiveUser.name || "");
  const [userName, setUserName] = useState(effectiveUser.userName || "");
  const [avatarUrl, setAvatarUrl] = useState(effectiveUser.avatar || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    setName(effectiveUser.name || "");
    setUserName(effectiveUser.userName || "");
    setAvatarUrl(effectiveUser.avatar || "");
    setAvatarFile(null);
  }, [effectiveUser.name, effectiveUser.userName, effectiveUser.avatar]);

 const handleProfileSubmit = async (e) => {
  e.preventDefault();

  const { success } = await updateProfile({
    name,
    userName,
    avatar: avatarUrl,  
    avatarFile,
  });

  if (!success) {
    
    return;
  }

  
  setIsEditMode(false);

};


  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
  };

  const avatarPreviewSrc = avatarFile
    ? URL.createObjectURL(avatarFile)
    : avatarUrl;

  return (
    <motion.form
      onSubmit={handleProfileSubmit}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.03 }}
      className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Profile</h2>
          <p className="text-[11px] text-neutral-400">
            Update your name, username and avatar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUpdatingProfile && (
            <span className="text-[11px] text-sky-300">Saving changes...</span>
          )}
          {!isEditMode && (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="text-[11px] text-sky-400 hover:text-sky-300 underline-offset-2 hover:underline"
            >
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-neutral-300">Display name</label>
          <input
            type="text"
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/60 disabled:opacity-60"
            placeholder="Your name"
            value={name}
            disabled={!isEditMode}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-neutral-300">Username</label>
          <div className="flex items-center rounded-xl border border-white/10 bg-slate-950/70 px-3">
            <span className="text-xs text-neutral-500 mr-1">@</span>
            <input
              type="text"
              className="w-full bg-transparent py-2 text-xs outline-none disabled:opacity-60"
              placeholder="username"
              value={userName}
              disabled={!isEditMode}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <p className="text-[10px] text-neutral-500">
            Your username must be unique.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        

        <div className="mt-2 flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            disabled={!isEditMode}
            onChange={handleAvatarFileChange}
            className="text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-slate-800 file:text-[10px] file:text-neutral-200 disabled:opacity-60"
          />
        </div>

        {avatarPreviewSrc && (
          <div className="mt-2 flex items-center gap-2">
            <img
              src={avatarPreviewSrc}
              alt="Avatar preview"
              className="h-10 w-10 rounded-full object-cover border border-white/10"
            />
            <p className="text-[10px] text-neutral-500">Preview</p>
          </div>
        )}

        <p className="text-[10px] text-neutral-500">
          Paste an image URL or select a file from your system. The backend will
          use <code className="text-[10px] bg-slate-800/80 px-1 rounded">req.file</code>{" "}
          when a file is uploaded.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        {isEditMode && (
          <>
            <button
              type="button"
              onClick={() => {
                setName(effectiveUser.name || "");
                setUserName(effectiveUser.userName || "");
                setAvatarUrl(effectiveUser.avatar || "");
                setAvatarFile(null);
                setIsEditMode(false);
              }}
              className="px-4 py-2 rounded-xl border border-white/10 text-xs text-neutral-200 hover:bg-slate-800/80 transition"
              disabled={isUpdatingProfile}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-4 py-2 rounded-xl bg-white text-slate-950 text-xs font-medium hover:bg-neutral-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {isUpdatingProfile ? "Saving..." : "Save profile"}
            </button>
          </>
        )}
      </div>
    </motion.form>
  );
}

export default ProfileForm;
