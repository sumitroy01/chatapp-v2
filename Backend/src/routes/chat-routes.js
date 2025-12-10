import express from "express";
import {
  accessChat,
  fetchChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  deleteChat,
} from "../controllers/chat-controllers.js";
import { protectRoute } from "../middleware/auth-middleware.js";
import upload from "../middleware/upload-middleware.js"; 

const router = express.Router();

router.post("/access", protectRoute, accessChat);            // create or return 1-1 chat (body: { userId })
router.get("/", protectRoute, fetchChats);                  // fetch all chats for requester ?limit=&page=
router.post("/group", protectRoute, createGroupChat);       // create group (body: { name, users: [] })
router.put("/rename", protectRoute,  upload.single("groupAvatar"), renameGroup);           // rename group (body: { chatId, name })
router.put("/add", protectRoute, addToGroup);               // add to group (body: { chatId, userId })
router.put("/remove", protectRoute, removeFromGroup);       // remove from group (body: { chatId, userId })
router.delete("/:chatId", protectRoute, deleteChat);


export default router;
