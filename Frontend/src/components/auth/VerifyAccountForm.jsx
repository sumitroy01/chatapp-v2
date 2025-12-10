// src/components/auth/VerifyAccountForm.jsx
import { useState } from "react";
import { motion } from "framer-motion";

function VerifyAccountForm({
  verifyUser,
  resendOtp,
  onBackToLogin,
  showBack,
  onBackToLanding,
}) {
  const [otpValue, setOtpValue] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpValue.trim()) return;

    const res = await verifyUser(otpValue.trim());
    if (res?.success) {
      setOtpValue("");
    }
  };

  const handleResend = async () => {
    await resendOtp();
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
          Enter OTP sent to your email
        </label>
        <input
          className="mt-1 w-full bg-white/5 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500/60"
          value={otpValue}
          onChange={(e) => setOtpValue(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="w-full mt-2 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-slate-950 transition"
      >
        Verify account
      </button>

      <button
        type="button"
        className="w-full text-[11px] text-sky-400 hover:text-sky-300 mt-1"
        onClick={handleResend}
      >
        Resend OTP
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

export default VerifyAccountForm;
