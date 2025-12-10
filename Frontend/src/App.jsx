// src/App.jsx
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import authStore from "./store/auth.store.js";
import chatstore from "./store/chat.store.js";
import userstore from "./store/user.store.js";

import Navbar from "./components/Navbar";
import LoggedOutHome from "./pages/LoggedOutHome";
import ChatPage from "./pages/ChatPage";
import AuthPage from "./pages/AuthPage.jsx";
import ProfileSettings from "./pages/ProfileSettings.jsx";

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <motion.div
            className="absolute inset-0 rounded-3xl bg-sky-500/80 blur-sm"
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-1 rounded-3xl bg-slate-900 flex items-center justify-center text-xs font-semibold"
            animate={{ rotate: [0, 4, -4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            chat
          </motion.div>
        </div>
        <motion.p
          className="text-sm text-neutral-300"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Preparing your workspace...
        </motion.p>
      </div>
    </div>
  );
}

function App() {
  const { authUser, isCheckingAuth, checkAuth,logOut } = authStore();

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"
  const [activeView, setActiveView] = useState("chat"); // "chat" | "settings"

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // When authUser changes, load profile + chats
  useEffect(() => {
    if (authUser) {
      // 1) call myUser from userstore
      const { myUser } = userstore.getState();
      if (typeof myUser === "function") {
        myUser();
      }

      // 2) call fetchChats from chatstore
      const { fetchChats, page, limit } = chatstore.getState();
      if (typeof fetchChats === "function") {
        fetchChats(page || 1, limit || 50);
      }

      setShowAuth(false);
      setActiveView("chat");
    } else {
      // reset view when logged out
      setActiveView("chat");
    }
  }, [authUser]);

  const openAuth = (mode) => {
    setAuthMode(mode || "login");
    setShowAuth(true);
  };

  const backToLanding = () => {
    setShowAuth(false);
  };

  if (isCheckingAuth) {
    return (
      <>
        <FullScreenLoader />
        <Toaster position="top-right" />
      </>
    );
  }

  const isLoggedIn = !!authUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar
        isLoggedIn={isLoggedIn}
        onLogout={logOut}
        onShowLogin={() => openAuth("login")}
        onShowSignup={() => openAuth("signup")}
        onOpenSettings={() => setActiveView("settings")}
        onGoHome={() => setActiveView("chat")}
        activeView={activeView}
      />

      <main className="mx-auto max-w-6xl px-4 pb-8 pt-4">
        <AnimatePresence mode="wait">
          {isLoggedIn ? (
            <motion.div
              key={activeView === "chat" ? "chat" : "settings"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {activeView === "chat" ? <ChatPage /> : <ProfileSettings />}
            </motion.div>
          ) : showAuth ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <AuthPage
                initialMode={authMode}
                onBackToLanding={backToLanding}
              />
            </motion.div>
          ) : (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <LoggedOutHome
                onShowLogin={() => openAuth("login")}
                onShowSignup={() => openAuth("signup")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Toaster position="top-right" />
    </div>
  );
}

export default App;
