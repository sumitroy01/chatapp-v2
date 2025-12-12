import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { initSocket } from "../socket";
import toast from "react-hot-toast";

const authStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLogginIn: false,
  isCheckingAuth: true,
  isResettingPass: false,
  isLogginOut: false,
  verficationPendingId: null,

  checkAuth: async () => {
  try {
    const res = await axiosInstance.get("/api/auth/check");
    const user = res.data;
    set({ authUser: user });
   
  } catch {
    set({ authUser: null });
  } finally {
    set({ isCheckingAuth: false });
  }
},


  signUp: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/api/auth/signup", data);
      set({ verficationPendingId: res.data.userId });
      toast.success(
        res.data.message || "otp sent successfully! check your email (spam folder)"
      );
      return { success: true, userId: res.data.userId, email: res.data.email };
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "signup failed";
      console.log("signup error", message);
      toast.error(message);
      return {
        success: false,
        message,
      };
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifyUser: async (otp) => {
    const { verficationPendingId } = get();

    if (!verficationPendingId) {
      toast.error("invalid user. please signup again");
      return { success: false };
    }

    try {
      const res = await axiosInstance.post("/api/auth/verify-user", {
        userId: verficationPendingId,
        otp,
      });

      set({
        authUser: res.data.user,
        verficationPendingId: null,
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      toast.success(res.data.message || "account verified successfully");
      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "invalid otp";
      console.log("error in verifyUser store:", message);
      toast.error(message);
      return { success: false };
    }
  },

  resendOtp: async () => {
    const { verficationPendingId } = get();

    if (!verficationPendingId) {
      toast.error("invalid user! please signup again");
      return { success: false };
    }

    try {
      const res = await axiosInstance.post("/api/auth/resend-otp", {
        userId: verficationPendingId,
      });
      toast.success(res.data.message || "otp resent successfully");
      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "could not resend otp";
      console.log("error in resendOtp store:", message);
      toast.error(message);
      return { success: false };
    }
  },
logIn: async ({ identifier, password }) => {
  set({ isLogginIn: true });
  try {
    const res = await axiosInstance.post("/api/auth/login", {
      identifier,
      password,
    });

    set({ authUser: res.data.user });

    if (res.data.token) {
      localStorage.setItem("token", res.data.token);
    }

    set({ verficationPendingId: null });

    toast.success(res.data.message || "logged in successfully");
    return { success: true };
  } catch (error) {
    const data = error?.response?.data;
    const message = data?.message || error.message || "login failed";

    if (data?.needsVerification && data?.userId) {
      set({ verficationPendingId: data.userId });

      toast.error(
        message || "please verify your account before logging in"
      );

      return { success: false, needsVerification: true, userId: data.userId };
    }

    console.log("error in logIn store", message);
    toast.error(message);
    return { success: false };
  } finally {
    set({ isLogginIn: false });
  }
},

  logOut: async () => {
    set({ isLogginOut: true });
    try {
      const res = await axiosInstance.post("/api/auth/logout");
      set({ authUser: null });
      localStorage.removeItem("token");
      toast.success(res.data?.message || "logged out successfully");
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "logout failed";
      toast.error(message);
      console.log("error in logout store", message);
    } finally {
      set({ isLogginOut: false });
    }
  },

  forgotPass: async (email) => {
    try {
      const res = await axiosInstance.post("/api/auth/password/request-reset",{email} );
      toast.success(
        res.data?.message || "otp sent to your email (check spam folder)"
      );
      return { success: true };
    } catch (error) {
     
      console.log("error in forgotPass store:", error.message);
      toast.error("couldnt request otp try again later");
      return { success: false };
    }
  },

  resetPass: async ({ email, otp, password }) => {
    set({ isResettingPass: true });
    try {
      const res = await axiosInstance.post("/api/auth/password/reset", {
        email,
        otp,
        password,
      });
      toast.success(
        res.data?.message ||
          "password reset successfully! please re-login to continue"
      );
      return { success: true };
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "password reset failed";
      console.log("error in resetPass store:", message);
      toast.error(message);
      return { success: false };
    } finally {
      set({ isResettingPass: false });
    }
  },
}));

export default authStore;
