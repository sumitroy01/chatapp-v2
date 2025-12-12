// src/store/user.store.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const userstore = create((set, get) => ({
  user: null,
  userFound: null,
  isChekingUser: false,
  isUpdatingProfile: false,
  isUpdatingEmail: false,
  isSearchingUser: false,

  emilUnverified: null,

  myUser: async () => {
    set({ isChekingUser: true });
    try {
      const res = await axiosInstance.get("/api/auth/check");
      set({ user: res.data });
    } catch (error) {
      console.log(`error in finding user: ${error.message}`);
      set({ user: null });
    } finally {
      set({ isChekingUser: false });
    }
  },

  findUser: async (userName) => {
    const value = userName && userName.trim();
    if (!value) return;

    set({ isSearchingUser: true, userFound: null });

    try {
      const res = await axiosInstance.get("/api/user/get/user", {
        params: { userName: value },
      });
      const user = res.data?.user ?? res.data;
      set({ userFound: user || null });
      console.log("user found successfully");
      
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error.message ||
        "failed to search user";

      console.log("error while searching user", error?.response || error);
      toast.error(message);
      set({ userFound: null });
    } finally {
      set({ isSearchingUser: false });
    }
  },

  updateProfile: async ({ name, userName, avatar, avatarFile }) => {
    set({ isUpdatingProfile: true });

    try {
      const formData = new FormData();

      if (name !== undefined) formData.append("name", name);
      if (userName !== undefined) formData.append("userName", userName);

      if (avatarFile) {
        formData.append("avatar", avatarFile);
      } else if (avatar) {
        formData.append("avatar", avatar);
      }

      await axiosInstance.post("/api/user/update-profile", formData, {
        withCredentials: true,
      });

      toast.success("profile updated sucessfully");
      return { success: true };
    } catch (error) {
      console.log(`error in updating profile`, error);
      toast.error(error?.response?.data?.message);
      return { success: false, error };
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  requestEmailUpdate: async ({ email, password }) => {
    set({ isUpdatingEmail: true });
    try {
      await axiosInstance.post("/api/user/email/change/request", {
        email,
        password,
      });

      toast.success("OTP sent to your new email");
      return { success: true };
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error("This email is already in use");
      } else if (error.response?.status === 401) {
        toast.error("Incorrect password");
      } else {
        toast.error(error?.response?.data?.message);
      }

      console.log("error in requestEmailUpdate", error);
      return { success: false, error };
    } finally {
      set({ isUpdatingEmail: false });
    }
  },

  updateEmail: async (otp) => {
    set({ isUpdatingEmail: true });
    try {
      await axiosInstance.post("/api/user/email/change/confirm", { otp });

      toast.success("Email updated successfully");
      return { success: true };
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error("Invalid or expired OTP");
      } else {
        toast.error("Failed to verify email");
      }

      console.log("error in updateEmail", error);
      return { success: false, error };
    } finally {
      set({ isUpdatingEmail: false });
    }
  },
  requestDeleteAccount: async (password) => {
  try {
    await axiosInstance.post("/api/user/delete-account/request", { password });
    toast.success("OTP sent to your email");
    return { success: true };
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error.message ||
      "failed to request delete";

    toast.error(msg);
    return { success: false, error };
  }
},

confirmDeleteAccount: async (otp) => {
  try {
    await axiosInstance.post("/api/user/delete-account/confirm", { otp });

    toast.success("Account deleted successfully");
    set({ user: null });

    return { success: true };
  } catch (error) {
    const msg =
      error?.response?.data?.message ||
      error.message ||
      "failed to delete account";

    toast.error(msg);
    return { success: false, error };
  }
},


  resendEmailOtp: async () => {
    try {
      await axiosInstance.post("/api/user/email/change/resend");
      toast.success("otp resent to your email");
    } catch (error) {
      console.log(`error in resendEmailOtp ${error.message}`);
      toast.error("please try later");
    }
  },
}));

export default userstore;
