import mongoose from "mongoose";

const chat = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      trim: true,
    },
    groupAvatar: {
      type: String,
      default: "",
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
    ],

    allUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
    ],

    mediaUrl: { type: String },
    mediaPublicId: { type: String },
    mediaFormat: { type: String },
    mediaSize: { type: Number },
  },
  { timestamps: true }
);

const chats = mongoose.model("Chats", chat);
export default chats;
