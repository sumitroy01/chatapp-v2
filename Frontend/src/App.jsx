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

// socket helpers
import { initSocket, getSocket } from "./socket.js";
import { registerSocketListeners } from "./lib/socket-listeners";

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

// helper: try to obtain token from auth store, localStorage or cookies
function getTokenFromClient() {
  try {
    const aState = authStore.getState();
    if (aState && aState.token) return aState.token;
  } catch (e) {
    // ignore
  }

  try {
    const fromStorage = localStorage.getItem("token");
    if (fromStorage) return fromStorage;
  } catch (e) {
    // ignore (server-side rendering or blocked)
  }

  try {
    const cookies = document.cookie.split(";").map((c) => c.trim());
    for (const c of cookies) {
      if (c.startsWith("token=")) return decodeURIComponent(c.split("=")[1]);
    }
  } catch (e) {
    // ignore
  }

  return null;
}

function App() {
  const { authUser, isCheckingAuth, checkAuth, logOut } = authStore();

  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "signup"
  const [activeView, setActiveView] = useState("chat"); // "chat" | "settings"

  // BOOT: run once on mount — check auth (no socket init here)
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      try {
        // checkAuth may update auth store; await it so we know the result
        const user = await checkAuth();
        if (!mounted) return;

        // do not init socket here: rely on authUser effect below
      } catch (err) {
        // optionally handle/log
        console.error("boot error:", err);
      }
    };

    boot();

    return () => {
      mounted = false;
      // ensure socket is disconnected on full unmount
      try {
        const s = getSocket();
        if (s && typeof s.disconnect === "function") s.disconnect();
      } catch (e) {
        // ignore
      }
    };
    // only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When authUser changes, load profile + chats and init/teardown socket
  useEffect(() => {
    // load profile + chats when logged in
    if (authUser) {
      // 1) call myUser from userstore
      const { myUser } = userstore.getState();
      if (typeof myUser === "function") {
        myUser().catch((e) => console.error("myUser failed", e));
      }

      // 2) call fetchChats from chatstore
      const { fetchChats, page, limit } = chatstore.getState();
      if (typeof fetchChats === "function") {
        fetchChats(page || 1, limit || 50).catch((e) =>
          console.error("fetchChats failed", e)
        );
      }

      setShowAuth(false);
      setActiveView("chat");

      // init socket and register listeners
      try {
        const backend = import.meta.env.VITE_BACKEND_URL || window.location.origin;
        const token = getTokenFromClient();
        initSocket(backend, token);
        // small timeout to ensure socket instance is available before registering
        setTimeout(() => {
          try {
            registerSocketListeners();
          } catch (err) {
            console.warn("registerSocketListeners failed:", err);
          }
        }, 50);
      } catch (err) {
        console.error("socket init failed:", err);
      }

    } else {
      // when logged out: teardown socket
      try {
        const s = getSocket();
        if (s && typeof s.disconnect === "function") s.disconnect();
      } catch (e) {
        // ignore
      }

      // reset view when logged out
      setActiveView("chat");
    }
    // only depends on authUser
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
              <AuthPage initialMode={authMode} onBackToLanding={backToLanding} />
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
