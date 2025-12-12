import express from "express";
import {
  updateProfile,
  requestUpdateEmail,
  updateEmail,
  getUserByUsername,
  resendUpdateEmailOtp,
  requestDeleteAccount,
  confirmDeleteAccount
} from "../controllers/user-controllers.js";
import { protectRoute } from "../middleware/auth-middleware.js";
import { checkAuth } from "../controllers/auth-controllers.js";
import upload from "../middleware/upload-middleware.js";

const router = express.Router();

router.get("/me", protectRoute, checkAuth);

router.get("/get/user", protectRoute, getUserByUsername);

router.post(
  "/update-profile",
  protectRoute,
  upload.single("avatar"),
  updateProfile
);

router.post("/email/change/request", protectRoute, requestUpdateEmail);
router.post("/email/change/confirm", protectRoute, updateEmail);
router.post("/email/change/resend", protectRoute, resendUpdateEmailOtp);

// delete account
router.post("/delete-account/request", protectRoute, requestDeleteAccount);
router.post("/delete-account/confirm", protectRoute, confirmDeleteAccount);

export default router;
