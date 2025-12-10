import mongoose from "mongoose";

const User = new mongoose.Schema(
  {
    userName: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    pendingEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
        "Password must include lowercase, uppercase, number, and special character",
      ],
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpires: {
      type: Date,
      select: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    status: {
      type: Boolean,
      default: false,
    },
    lastOtpSent: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

const Users = mongoose.model("Users", User);
export default Users;
