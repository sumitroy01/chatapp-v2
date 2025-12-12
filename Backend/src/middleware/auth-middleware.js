import Users from "../models/user-models.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "No user credentials found!! please login/signup" });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "token has been expired" });
    }

    // support possible variations and log cookies for debugging
    const uid = decoded?.userId || decoded?.userID || decoded?.id;
    if (!uid) {
      console.log("auth: token decoded but no user id present:", decoded);
      return res.status(401).json({ message: "invalid token payload" });
    }

    const user = await Users.findById(uid).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "user not found!! please create a new account" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("error in auth-middleware", error.message);
    return res.status(500).json({ message: "internal server error" });
  }
};
