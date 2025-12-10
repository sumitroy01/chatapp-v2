// src/pages/ProfileSettings.jsx
import { useEffect } from "react";
import { motion } from "framer-motion";

import userstore from "../store/user.store.js";
import authStore from "../store/auth.store.js";

import UserSummaryCard from "../components/user/UserSummaryCard.jsx";
import ProfileForm from "../components/user/ProfileForm.jsx";
import EmailChangeSection from "../components/user/EmailChangeSection.jsx";

function ProfileSettings() {
  const { authUser,logOut } = authStore();

  const {
    user,
    myUser,
    
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
            <UserSummaryCard effectiveUser={authUser} onLogout={logOut} />
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
    </div>
  );
}

export default ProfileSettings;
