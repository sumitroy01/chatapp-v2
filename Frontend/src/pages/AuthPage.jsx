// src/pages/AuthPage.jsx
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import authStore from "../store/auth.store.js";

import LoginForm from "../components/auth/LoginForm.jsx";
import SignupForm from "../components/auth/SignupForm.jsx";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm.jsx";
import ResetPasswordForm from "../components/auth/ResetPasswordForm.jsx";
import VerifyAccountForm from "../components/auth/VerifyAccountForm.jsx";

function AuthPage({ initialMode = "login", onBackToLanding }) {
  const {
    signUp,
    logIn,
    forgotPass,
    resetPass,
    verifyUser,
    resendOtp,
    isSigningUp,
    isLogginIn,
    isResettingPass,
    verficationPendingId,
  } = authStore();

  // main mode state
  const [mode, setMode] = useState(
    verficationPendingId ? "verify" : initialMode
  );

  // keep mode in sync with initialMode when NOT verifying
  useEffect(() => {
    if (!verficationPendingId) {
      setMode(initialMode);
    }
  }, [initialMode, verficationPendingId]);

  const [resetEmail, setResetEmail] = useState("");

  const showBack = typeof onBackToLanding === "function";

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
      <motion.div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-xl p-5 shadow-2xl shadow-black/50"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        {/* -------- Header & tabs -------- */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold">
              {mode === "login"
                ? "Welcome back"
                : mode === "signup"
                ? "Create an account"
                : mode === "forgot"
                ? "Forgot password"
                : mode === "reset"
                ? "Reset password"
                : "Verify your account"}
            </p>
            <p className="text-[11px] text-neutral-400">
              {mode === "login"
                ? "Log in to continue your conversations."
                : mode === "signup"
                ? "Set up your profile and start chatting."
                : mode === "forgot"
                ? "Enter your email to receive a reset OTP."
                : mode === "reset"
                ? "Use the OTP sent to your email."
                : "Enter the OTP sent to your email."}
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] bg-white/5 rounded-full px-2 py-1">
            <button
              className={
                mode === "login" || mode === "forgot" || mode === "reset"
                  ? "font-medium"
                  : "text-neutral-400"
              }
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <span className="text-neutral-500">/</span>
            <button
              className={mode === "signup" ? "font-medium" : "text-neutral-400"}
              onClick={() => setMode("signup")}
            >
              Signup
            </button>
          </div>
        </div>

        {/* -------- Forms with animation -------- */}
        <AnimatePresence mode="wait">
          {mode === "login" && (
            <LoginForm
              key="login"
              logIn={logIn}
              isLogginIn={isLogginIn}
              onForgot={() => setMode("forgot")}
              onVerify={() => setMode("verify")}
              verficationPendingId={verficationPendingId}
              showBack={showBack}
              onBackToLanding={onBackToLanding}
            />
          )}

          {mode === "signup" && (
            <SignupForm
              key="signup"
              signUp={signUp}
              isSigningUp={isSigningUp}
              onSignupSuccess={() => setMode("verify")}
              showBack={showBack}
              onBackToLanding={onBackToLanding}
            />
          )}

          {mode === "forgot" && (
            <ForgotPasswordForm
              key="forgot"
              forgotPass={forgotPass}
              onSuccess={(email) => {
                setResetEmail(email);
                setMode("reset");
              }}
              onBackToLogin={() => setMode("login")}
              showBack={showBack}
              onBackToLanding={onBackToLanding}
            />
          )}

          {mode === "reset" && (
            <ResetPasswordForm
              key="reset"
              resetPass={resetPass}
              isResettingPass={isResettingPass}
              initialEmail={resetEmail}
              onSuccess={() => {
                setResetEmail("");
                setMode("login");
              }}
              onBackToLogin={() => setMode("login")}
              showBack={showBack}
              onBackToLanding={onBackToLanding}
            />
          )}

          {mode === "verify" && (
            <VerifyAccountForm
              key="verify"
              verifyUser={verifyUser}
              resendOtp={resendOtp}
              onBackToLogin={() => setMode("login")}
              showBack={showBack}
              onBackToLanding={onBackToLanding}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export default AuthPage;
