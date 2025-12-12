import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import userstore from "../store/user.store.js";
import authStore from "../store/auth.store.js";

import UserSummaryCard from "../components/user/UserSummaryCard.jsx";
import ProfileForm from "../components/user/ProfileForm.jsx";
import EmailChangeSection from "../components/user/EmailChangeSection.jsx";
import toast from "react-hot-toast";

function ProfileSettings() {
  const { authUser, logOut } = authStore();

  const {
    user,
    myUser,
    requestDeleteAccount,
    confirmDeleteAccount,
    updateProfile,
    requestEmailUpdate,
    updateEmail,
    resendEmailOtp,
    isUpdatingProfile,
    isUpdatingEmail,
  } = userstore();

  const effectiveUser = user || authUser || {};

  useEffect(() => {
    if (!user) {
      myUser();
    }
  }, [user, myUser]);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1 = enter password, 2 = enter otp
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isRequestingDelete, setIsRequestingDelete] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const openDelete = () => {
    setPassword("");
    setOtp("");
    setDeleteStep(1);
    setShowDeleteModal(true);
  };

  const closeDelete = () => {
    setShowDeleteModal(false);
    setPassword("");
    setOtp("");
    setDeleteStep(1);
  };

  const handleRequestOtp = async () => {
    if (!password) {
      toast.error("please enter your password");
      return;
    }
    setIsRequestingDelete(true);
    const res = await requestDeleteAccount(password);
    setIsRequestingDelete(false);
    if (res.success) {
      setDeleteStep(2);
      toast.success("otp sent to your email");
    }
  };

  const handleConfirmDelete = async () => {
    if (!otp) {
      toast.error("please enter the otp");
      return;
    }
    setIsConfirmingDelete(true);
    const res = await confirmDeleteAccount(otp);
    setIsConfirmingDelete(false);
    if (res.success) {
      toast.success("account deleted");
      closeDelete();
      logOut();
    }
  };

  const handleResendOtp = async () => {
    if (!password) {
      toast.error("password required to resend otp");
      return;
    }
    setIsRequestingDelete(true);
    const res = await requestDeleteAccount(password);
    setIsRequestingDelete(false);
    if (res.success) {
      toast.success("otp resent");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            Account settings
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage your profile, username, avatar and email.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <UserSummaryCard
              effectiveUser={authUser}
              onLogout={logOut}
              onDelete={openDelete}
            />
          </motion.div>

          <div className="flex flex-col gap-6">
            <ProfileForm
              effectiveUser={effectiveUser}
              updateProfile={updateProfile}
              isUpdatingProfile={isUpdatingProfile}
            />

            <EmailChangeSection
              requestEmailUpdate={requestEmailUpdate}
              updateEmail={updateEmail}
              resendEmailOtp={resendEmailOtp}
              isUpdatingEmail={isUpdatingEmail}
            />
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeDelete}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900/90 border border-white/5 p-6">
            <h2 className="text-lg font-semibold mb-3">Delete account</h2>
            {deleteStep === 1 ? (
              <>
                <p className="text-sm text-neutral-400 mb-4">
                  Enter your password to receive an OTP to your email.
                </p>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm mb-4"
                  placeholder="current password"
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={closeDelete}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestOtp}
                    disabled={isRequestingDelete}
                    className="px-3 py-1.5 rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 text-sm hover:bg-red-500/20 transition"
                  >
                    {isRequestingDelete ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-neutral-400 mb-4">
                  Enter the OTP sent to your email to permanently delete your
                  account.
                </p>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm mb-4"
                  placeholder="6-digit OTP"
                />
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => {
                      setDeleteStep(1);
                      setOtp("");
                    }}
                    className="text-xs text-neutral-400"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleResendOtp}
                    className="text-xs text-neutral-400"
                  >
                    Resend OTP
                  </button>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={closeDelete}
                    className="px-3 py-1.5 rounded-xl border border-white/10 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isConfirmingDelete}
                    className="px-3 py-1.5 rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 text-sm hover:bg-red-500/20 transition"
                  >
                    {isConfirmingDelete ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSettings;
