// src/components/auth/ForgotPasswordForm.jsx
import { useState } from "react";
import { motion } from "framer-motion";

function ForgotPasswordForm({
  forgotPass,
  onSuccess,
  onBackToLogin,
  showBack,
  onBackToLanding,
}) {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    const res = await forgotPass(email.trim());
    if (res?.success) {
      onSuccess(email.trim()); // tell parent so it can prefill reset
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      onSubmit={handleSubmit}
      className="space-y-3 text-sm"
    >
      <div>
        <label className="text-[11px] text-neutral-400">
          Registered email
        </label>
        <input
          className="mt-1 w-full bg-white/5 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500/60"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />
      </div>

      <button
        type="submit"
        className="w-full mt-2 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-slate-950 transition"
      >
        Send reset OTP
      </button>

      <button
        type="button"
        className="w-full text-[11px] text-neutral-400 hover:text-neutral-200 mt-1"
        onClick={onBackToLogin}
      >
        Back to login
      </button>

      {showBack && (
        <button
          type="button"
          className="mt-2 w-full text-[11px] text-neutral-400 hover:text-neutral-200"
          onClick={onBackToLanding}
        >
          Back to home
        </button>
      )}
    </motion.form>
  );
}

export default ForgotPasswordForm;
