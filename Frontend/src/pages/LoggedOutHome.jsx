// src/pages/LoggedOutHome.jsx
import { motion } from "framer-motion";

function LoggedOutHome({ onShowLogin, onShowSignup }) {
  return (
    <div className="flex flex-col lg:flex-row items-center gap-10 mt-8">
      <motion.div
        className="flex-1 space-y-4"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
      >
        <p className="text-[11px] uppercase tracking-[0.35em] text-sky-400">
          Realtime messaging
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          A clean chat surface for serious conversations.
        </h1>
        <p className="text-sm text-neutral-300 max-w-md">
          No neon green bubbles, no clutter. Just fast conversations with a
          focused interface that feels like a modern web app, not a phone clone.
        </p>
        <div className="flex gap-3 pt-3">
          <button
            className="px-4 py-2 rounded-xl bg-white text-slate-950 text-sm font-medium hover:bg-neutral-100 transition"
            onClick={onShowSignup}
          >
            Get started
          </button>
          <button
            className="px-4 py-2 rounded-xl border border-white/20 text-sm hover:bg-white/5 transition"
            onClick={onShowLogin}
          >
            Login
          </button>
        </div>
        <p className="text-[11px] text-neutral-500 pt-1">
          Tip: create focused groups for projects, clients, or teams.
        </p>
      </motion.div>

      {/* right preview stays same */}
      {/* ... */}
    </div>
  );
}

export default LoggedOutHome;
