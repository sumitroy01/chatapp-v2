// src/components/Navbar.jsx
import { motion } from "framer-motion";

function Navbar({
  isLoggedIn,
           
  onShowLogin,
  onShowSignup,
  onOpenSettings,
  onGoHome,
  activeView,
}) {
  

  return (
    <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 group"
         
        >
          <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-green-300 to-blue-100 flex items-center justify-center text-xs font-semibold">
             🗣️
          </div>
          <div className="flex flex-col items-start leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              Yap Yap
            </span>
            <span className="text-[11px] text-neutral-400 group-hover:text-neutral-200 transition">
              real time chatting solution
            </span>
          </div>
        </button>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {/* Home button only in settings view */}
              {activeView === "settings" && (
                <button
                  onClick={onGoHome}
                  className="flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition"
                >
                  <span className="text-base">🏠</span>
                  <span className="font-medium">Home</span>
                </button>
              )}

              {/* Round avatar button -> opens settings */}
              <motion.button
                type="button"
                onClick={onOpenSettings}
                whileTap={{ scale: 0.95 }}
                className="h-9 w-9 bg-green-800 rounded-full border border-white/15 flex items-center justify-center text-m font-semibold uppercase hover:bg-white/15 transition"
              >
               ME 
              </motion.button>
            </>
          ) : (
            <>
              <button
                onClick={onShowLogin}
                className="text-xs px-3 py-1.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition"
              >
                Log in
              </button>
              <button
                onClick={onShowSignup}
                className="text-xs px-3 py-1.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold transition"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
