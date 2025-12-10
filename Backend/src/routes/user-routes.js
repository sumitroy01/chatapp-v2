import express from "express";
import {
  updateProfile,
  requestUpdateEmail,
  updateEmail,
  getUserByUsername,
  resendUpdateEmailOtp,
} from "../controllers/user-controllers.js";
import { protectRoute } from "../middleware/auth-middleware.js";
import { checkAuth } from "../controllers/auth-controllers.js";
import upload from "../middleware/upload-middleware.js"; 
const router = express.Router();

//me 
router.get("/me", protectRoute, checkAuth);

//getprofile
router.get("/get/user", protectRoute, getUserByUsername);

// update profile
router.post(
  "/update-profile",
  protectRoute,
  upload.single("avatar"),   // ⬅️ this wires req.file for avatar
  updateProfile
);



// change email
router.post("/email/change/request", protectRoute, requestUpdateEmail);
router.post("/email/change/confirm", protectRoute, updateEmail);
router.post("/email/change/resend",protectRoute,resendUpdateEmailOtp);


export default router;