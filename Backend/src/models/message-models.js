import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chats",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: null,
    },
    cipherText: {
      type: String,
      default: null,
    },
    iv: {
      type: String,
      default: null,
    },
    algo: {
      type: String,
      enum: ["plain", "aes-gcm-v1"],
      default: "plain",
    },

    messageType: {
      type: String,
      enum: ["text", "image", "gif", "link", "audio", "file", "video"],
      default: "text",
    },

    reaction: [
      {
        emoji: {
          type: String,
          required: true,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
          required: true,
        },
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],

    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    audioDuration: {
      type: Number,
    },

    // models/message-models.js (add these fields to your schema)
mediaUrl: {
  type: String,
},

mediaPublicId: {
  type: String,
},

mediaFormat: {
  type: String,
},

mediaSize: {
  type: Number,
},

audioDuration: {
  type: Number,
},


  },
  { timestamps: true }
);

const messages = mongoose.model("Messages", messageSchema);
export default messages;
