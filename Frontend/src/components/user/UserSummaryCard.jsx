function UserSummaryCard({ effectiveUser, onLogout, onDelete }) {
  if (!effectiveUser) {
    return null;
  }

  const initialSource =
    effectiveUser.name ||
    effectiveUser.userName ||
    effectiveUser.email ||
    "?";

  const initial = initialSource[0]?.toUpperCase() || "?";

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {effectiveUser.avatar ? (
            <img
              src={effectiveUser.avatar}
              alt="avatar"
              className="h-14 w-14 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center text-xl font-semibold">
              {initial}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold">
              {effectiveUser.name || "Your name"}
            </span>
            <span className="text-xs text-neutral-400">
              @{effectiveUser.userName || "username"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDelete}
            className="text-[11px] px-3 py-1.5 rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition"
          >
            Delete
          </button>
          <button
            onClick={onLogout}
            className="text-[11px] px-3 py-1.5 rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-slate-950/60 border border-white/5 px-3 py-2.5">
        <p className="text-[11px] text-neutral-400 mb-1.5">Primary email</p>
        <p className="text-xs font-medium break-all">
          {effectiveUser.email || "not set"}
        </p>
      </div>

      <p className="text-[11px] text-neutral-500">
        Changes to username or email might affect how others find you in YapYap.
      </p>
    </div>
  );
}

export default UserSummaryCard;
