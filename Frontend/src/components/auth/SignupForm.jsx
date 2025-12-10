// src/components/auth/SignupForm.jsx
import { useState } from "react";
import { motion } from "framer-motion";

function SignupForm({
  signUp,
  isSigningUp,
  onSignupSuccess,
  showBack,
  onBackToLanding,
}) {
  const [signupData, setSignupData] = useState({
    name: "",
    userName: "",
    email: "",
    password: "",
    confirmPass: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !signupData.password ||
      signupData.password !== signupData.confirmPass
    ) {
      return;
    }

    const res = await signUp({
      name: signupData.name,
      userName: signupData.userName,
      email: signupData.email,
      password: signupData.password,
    });

    if (res?.success) {
      onSignupSuccess();
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
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-neutral-400">Name</label>
          <input
            className="mt-1 w-full bg-white/5 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500/60"
            value={signupData.name}
            onChange={(e) =>
              setSignupData((prev) => ({
                ...prev,
                name: e.target.value,
              }))
            }
          />
        </div>
        <div className="flex-1">
          <label className="text-[11px] text-neutral-400">
            Username{" "}
            <span className="text-neutral-500">(optional)</span>
          </label>
          <input
            className="mt-1 w-full bg-white/5 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500/60"
            value={signupData.userName}
            onChange={(e) =>
              setSignupData((prev) => ({
                ...prev,
                userName: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] text-neutral-400">Email</label>
        <input
          className="mt-1 w-full bg-white/5 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-sky-500/60"
          value={signupData.email}
          onChange={(e) =>
            setSignupData((prev) => ({
              ...prev,
              email: e.target.value,
            }))
          }
          type="email"
        />
      </div>

      <div className="flex gap-2">
        {/* Password */}
        <div className="flex-1">
          <label className="text-[11px] text-neutral-400">
            Password
          </label>
          <div className="mt-1 relative">
            <input
              className="w-full bg-white/5 rounded-xl px-3 py-2 pr-9 outline-none focus:ring-1 focus:ring-sky-500/60"
              value={signupData.password}
              onChange={(e) =>
                setSignupData((prev) => ({
                  ...prev,
                  password: e.target.value,
                }))
              }
              type={showPassword ? "text" : "password"}
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-2 flex items-center justify-center text-neutral-400 hover:text-neutral-200"
            >
              {showPassword ? (
                // Eye open
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12C3.5 7.5 7.25 4.5 12 4.5s8.5 3 9.75 7.5c-1.25 4.5-5 7.5-9.75 7.5S3.5 16.5 2.25 12z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                // Eye off
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3l18 18M10.584 10.59A3 3 0 0113.41 13.41M9.88 4.25A8.7 8.7 0 0112 4c4.75 0 8.5 3 9.75 7.5-.39 1.4-1.02 2.66-1.84 3.75M6.23 6.21C4.41 7.3 3.08 8.96 2.25 12 3.5 16.5 7.25 19.5 12 19.5c1.06 0 2.08-.16 3.04-.46"
                  />
                </svg>
              )}
            </motion.button>
          </div>
        </div>

        {/* Confirm password */}
        <div className="flex-1">
          <label className="text-[11px] text-neutral-400">
            Confirm
          </label>
          <div className="mt-1 relative">
            <input
              className="w-full bg-white/5 rounded-xl px-3 py-2 pr-9 outline-none focus:ring-1 focus:ring-sky-500/60"
              value={signupData.confirmPass}
              onChange={(e) =>
                setSignupData((prev) => ({
                  ...prev,
                  confirmPass: e.target.value,
                }))
              }
              type={showConfirmPassword ? "text" : "password"}
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-2 flex items-center justify-center text-neutral-400 hover:text-neutral-200"
            >
              {showConfirmPassword ? (
                // Eye open
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12C3.5 7.5 7.25 4.5 12 4.5s8.5 3 9.75 7.5c-1.25 4.5-5 7.5-9.75 7.5S3.5 16.5 2.25 12z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                // Eye off
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3l18 18M10.584 10.59A3 3 0 0113.41 13.41M9.88 4.25A8.7 8.7 0 0112 4c4.75 0 8.5 3 9.75 7.5-.39 1.4-1.02 2.66-1.84 3.75M6.23 6.21C4.41 7.3 3.08 8.96 2.25 12 3.5 16.5 7.25 19.5 12 19.5c1.06 0 2.08-.16 3.04-.46"
                  />
                </svg>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSigningUp}
        className="w-full mt-2 px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-slate-950 transition disabled:opacity-60"
      >
        {isSigningUp ? "Creating account..." : "Create account"}
      </button>

      {showBack && (
        <button
          type="button"
          className="mt-3 w-full text-[11px] text-neutral-400 hover:text-neutral-200"
          onClick={onBackToLanding}
        >
          Back to home
        </button>
      )}
    </motion.form>
  );
}

export default SignupForm;
