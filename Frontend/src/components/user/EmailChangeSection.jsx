// src/components/settings/EmailChangeSection.jsx
import { useState } from "react";
import { motion } from "framer-motion";

function EmailChangeSection({
  requestEmailUpdate,
  updateEmail,
  resendEmailOtp,
  isUpdatingEmail,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [emailStep, setEmailStep] = useState("request");
  const [isEditing, setIsEditing] = useState(false);

  const handleRequestEmail = async (e) => {
  e.preventDefault();
  const { success } = await requestEmailUpdate({ email, password });
  if (!success) return;
  setEmailStep("verify");
};


  const handleVerifyEmail = async (e) => {
  e.preventDefault();
  if (!otp.trim()) return;

  const { success } = await updateEmail(otp.trim());
  if (!success) return;

  window.location.reload();
};


  const handleResend = (e) => {
    e.preventDefault();
    resendEmailOtp();
  };

  const handleToggleEdit = () => {
    if (isEditing) {
      setEmail("");
      setPassword("");
      setOtp("");
      setEmailStep("request");
    }
    setIsEditing((prev) => !prev);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.06 }}
      className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Change email</h2>
          <p className="text-[11px] text-neutral-400">
            Securely update your login email using OTP verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isUpdatingEmail && (
            <span className="text-[11px] text-sky-300">Updating email...</span>
          )}
          <button
            type="button"
            onClick={handleToggleEdit}
            className="px-3 py-1.5 rounded-xl border border-white/15 text-[11px] text-neutral-200 hover:bg-white/5 transition"
          >
            {isEditing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {!isEditing && (
        <p className="text-[11px] text-neutral-500">
          Click <span className="font-medium text-neutral-300">Edit</span> to
          change your email.
        </p>
      )}

      {emailStep === "request" && isEditing && (
        <form onSubmit={handleRequestEmail} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-neutral-300">New email</label>
            <input
              type="email"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/60"
              placeholder="new-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-neutral-300">
              Current password
            </label>
            <input
              type="password"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/60"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-[10px] text-neutral-500">
              We use your password to confirm it&apos;s really you.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-500 text-xs font-medium hover:bg-sky-400 transition"
            >
              Send OTP to new email
            </button>
          </div>
        </form>
      )}

      {emailStep === "verify" && isEditing && (
        <form onSubmit={handleVerifyEmail} className="flex flex-col gap-3">
          <div className="rounded-xl bg-slate-950/60 border border-white/5 px-3 py-2.5 text-[11px] text-neutral-400">
            OTP has been sent to your new email (if request succeeded). Enter
            the 6-digit code to confirm the change.
          </div>

          <div className="flex flex-col gap-1.5 max-w-xs">
            <label className="text-[11px] text-neutral-300">Enter OTP</label>
            <input
              type="text"
              inputMode="numeric"
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs tracking-[0.25em] text-center outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/60"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
            />
            <p className="text-[10px] text-neutral-500">
              OTP is valid for a limited time. You can request a new one if it
              expired.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleResend}
              className="text-[11px] text-sky-300 hover:text-sky-200 underline-offset-2 hover:underline"
            >
              Resend OTP
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmailStep("request");
                  setOtp("");
                  setPassword("");
                }}
                className="px-3 py-1.5 rounded-xl border border-white/15 text-[11px] text-neutral-300 hover:bg-white/5"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isUpdatingEmail}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 text-xs font-medium hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {isUpdatingEmail ? "Verifying..." : "Verify & update"}
              </button>
            </div>
          </div>
        </form>
      )}
    </motion.div>
  );
}

export default EmailChangeSection;
