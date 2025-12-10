import express from "express";
import { protectRoute } from "../middleware/auth-middleware.js";
import {
  logIn,
  signUp,
  checkAuth,
  logOut,
  requestResetPassword,
  resetPassword,
  verifyUser,
  
} from "../controllers/auth-controllers.js";

const router = express.Router();

//  basic
router.post("/signup", signUp);
router.post("/login", logIn);
router.post("/logout", protectRoute, logOut);
router.get("/check", protectRoute, checkAuth);


router.post("/verify-user", verifyUser); 

// password reset 
router.post("/password/request-reset", requestResetPassword); 
router.post("/password/reset", resetPassword);               
 

export default router;
