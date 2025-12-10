import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { generateToken } from "../utils/token-utils.js";
import { sendOtp } from "../utils/email-utils.js";
import Users from "../models/user-models.js";

dotenv.config();

const OTP_VT = 5 * 60 * 1000; // 5 mins
const RESEND_CD = 30 * 1000; // 30 sec
const SALT_ROUNDS = 10;

const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const signUp = async (req, res) => {
  try {
    let { name, userName, email, password } = req.body;

    // normalize email + username
    if (email) {
      email = email.trim().toLowerCase();
    }
    userName = userName ? userName.trim() : "";

    // username is NOT mandatory anymore
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "please fill the mandatory fields" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "password length must be more than or equal to 8" });
    }

    // check existing by email (verified or not)
    let myUser = await Users.findOne({ email }).select(
      "+otp +otpExpires +lastOtpSent"
    );

    if (myUser && myUser.isVerified) {
      return res.status(409).json({ message: "user already exists" });
    }

    // if unverified and OTP expired → delete user so they can start fresh
    if (myUser && !myUser.isVerified) {
      const isExpired =
        !myUser.otpExpires || Date.now() > myUser.otpExpires.getTime();

      if (isExpired) {
        await Users.deleteOne({ _id: myUser._id });
        myUser = null; // treat as new user below
      }
    }

    // unique username check ONLY if userName is provided
    if (userName) {
      const duplicateUsername = await Users.findOne({ userName });
      if (
        duplicateUsername &&
        (!myUser ||
          duplicateUsername._id.toString() !== myUser._id.toString())
      ) {
        return res
          .status(409)
          .json({ message: "user with this username already exists" });
      }
    }

    // rate limit OTP resend for unverified (and not expired – expired got deleted above)
    if (myUser && !myUser.isVerified) {
      if (
        myUser.lastOtpSent &&
        Date.now() - myUser.lastOtpSent.getTime() < RESEND_CD
      ) {
        return res
          .status(429)
          .json({ message: "please wait before requesting a new otp" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const otp = genOtp();
    const hashedOtp = await bcrypt.hash(otp.toString(), SALT_ROUNDS);
    const otpReset = Date.now() + OTP_VT;
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;

    let myNewUser;

    if (myUser && !myUser.isVerified) {
      // update existing unverified user
      myUser.name = name;
      if (userName) {
        myUser.userName = userName;
      }
      myUser.password = hashedPassword;
      myUser.otp = hashedOtp;
      myUser.otpExpires = new Date(otpReset);
      myUser.lastOtpSent = new Date();
      if (!myUser.avatar) {
        myUser.avatar = avatarUrl;
      }
      myNewUser = myUser;
    } else {
      // create new user
      const newUserData = {
        name,
        email,
        password: hashedPassword,
        otp: hashedOtp,
        otpExpires: new Date(otpReset),
        avatar: avatarUrl,
        lastOtpSent: new Date(),
      };

      if (userName) {
        newUserData.userName = userName;
      }

      myNewUser = new Users(newUserData);
    }

    try {
      await myNewUser.save();
    } catch (error) {
      if (error && error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0] || "field";
        return res.status(409).json({ message: `${field} already exists` });
      }
      console.log("error while saving user", error.message || error);
      return res.status(500).json({ message: "internal server error" });
    }

    try {
      const emailToSend = myNewUser.email;
      await sendOtp(emailToSend, otp);
    } catch (error) {
      console.log("error while sending email", error.message || error);
      return res
        .status(500)
        .json({ message: "could not send otp at the moment" });
    }

    return res.status(201).json({
      message: "otp sent to email, please verify the account",
      userId: myNewUser._id,
      email: myNewUser.email,
    });
  } catch (error) {
    console.log("error in signup controller", error.message || error);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const resendOtp = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "invalid user" });
    }

    const myUser = await Users.findById(userId).select(
      "+otp +otpExpires +lastOtpSent +email"
    );

    if (!myUser) {
      return res.status(404).json({ message: "user not found" });
    }

    if (myUser.isVerified) {
      return res.status(400).json({ message: "user is already verified" });
    }

    // if otp expired for an unverified user → delete and force re-signup
    if (
      !myUser.otpExpires ||
      Date.now() > new Date(myUser.otpExpires).getTime()
    ) {
      await Users.deleteOne({ _id: myUser._id });
      return res
        .status(410)
        .json({ message: "otp expired, please sign up again" });
    }

    if (
      myUser.lastOtpSent &&
      Date.now() - myUser.lastOtpSent.getTime() < RESEND_CD
    ) {
      return res
        .status(429)
        .json({ message: "please wait before requesting a new otp" });
    }

    const otp = genOtp();
    myUser.otp = await bcrypt.hash(otp.toString(), SALT_ROUNDS);
    myUser.otpExpires = new Date(Date.now() + OTP_VT);
    myUser.lastOtpSent = new Date();

    await myUser.save();

    try {
      await sendOtp(myUser.email, otp);
    } catch (error) {
      console.log("error while sending otp (resend)", error.message || error);
      return res
        .status(500)
        .json({ message: "could not resend otp at the moment" });
    }

    return res.status(200).json({ message: "otp resent successfully" });
  } catch (error) {
    console.log("error in resendOtp controller", error.message || error);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const verifyUser = async (req, res) => {
  try {
    let { email, userId, otp } = req.body;

    if ((!userId && !email) || !otp) {
      return res.status(400).json({ message: "invalid user" });
    }

    if (email) {
      email = email.trim().toLowerCase();
    }

    let myCurrentUser;
    if (userId) {
      myCurrentUser = await Users.findById(userId).select("+otp +otpExpires");
    } else if (email) {
      myCurrentUser = await Users.findOne({ email }).select("+otp +otpExpires");
    }

    if (!myCurrentUser) {
      return res.status(404).json({ message: "user not found" });
    }

    if (myCurrentUser.isVerified) {
      return res.status(400).json({ message: "user is already verified" });
    }

    if (
      !myCurrentUser.otp ||
      !myCurrentUser.otpExpires ||
      Date.now() > new Date(myCurrentUser.otpExpires).getTime()
    ) {
      // otp expired for unverified user → delete and force re-signup
      if (!myCurrentUser.isVerified) {
        await Users.deleteOne({ _id: myCurrentUser._id });
      }
      return res
        .status(422)
        .json({ message: "otp expired, please sign up again" });
    }

    const otpMatch = await bcrypt.compare(otp.toString(), myCurrentUser.otp);
    if (!otpMatch) {
      return res.status(422).json({ message: "invalid otp" });
    }

    myCurrentUser.isVerified = true;
    myCurrentUser.otp = undefined;
    myCurrentUser.otpExpires = undefined;
    await myCurrentUser.save();

    const token = generateToken(myCurrentUser._id, res);

    return res.status(200).json({
      message: "user successfully verified",
      user: {
        _id: myCurrentUser._id,
        name: myCurrentUser.name,
        email: myCurrentUser.email,
        userName: myCurrentUser.userName,
        avatar: myCurrentUser.avatar,
        isVerified: myCurrentUser.isVerified,
      },
      token,
    });
  } catch (error) {
    console.log("error in verify user route", error.message || error);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const logIn = async (req, res) => {
  try {
    let { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "all fields are required" });
    }

    // Normalize / trim input
    identifier = identifier.trim();
    const isEmail = identifier.includes("@");

    let query = {};

    if (isEmail) {
      // emails are usually unique + case-insensitive
      query = { email: identifier.toLowerCase() };
    } else {
      // username login
      query = { userName: identifier };
    }

    // get user with password for login
    const myUser = await Users.findOne(query).select("+password");

    if (!myUser) {
      return res.status(404).json({ message: "user not found" });
    }

    // block login if not verified
    if (!myUser.isVerified) {
      return res.status(403).json({
        message: "please verify your account before logging in",
        needsVerification: true,
        userId: myUser._id,
        email: myUser.email,
      });
    }

    const passwordMatch = await bcrypt.compare(password, myUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "please check the password" });
    }

    const token = generateToken(myUser._id, res);

    return res.status(200).json({
      message: "user logged in successfully",
      user: {
        _id: myUser._id,
        name: myUser.name,
        email: myUser.email,
        userName: myUser.userName,
        avatar: myUser.avatar,
        isVerified: myUser.isVerified,
      },
      token,
    });
  } catch (error) {
    console.log("error in login route", error.message || error);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const logOut = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    return res.status(200).json({ message: "logged out successfully" });
  } catch (error) {
    console.log("error in logout controller", error.message || error);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const checkAuth = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "unauthenticated" });
    }
    // req.user should already be sanitized by auth middleware
    return res.status(200).json(req.user);
  } catch (error) {
    console.log("error in checkAuth", error.message || error);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const requestResetPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    email = email.trim().toLowerCase();

    const myUser = await Users.findOne({ email }).select(
      "+otp +otpExpires +lastOtpSent"
    );
    if (!myUser) {
      return res.status(404).json({ message: "user doesn't exist" });
    }

    if (
      myUser.lastOtpSent &&
      Date.now() - myUser.lastOtpSent.getTime() < RESEND_CD
    ) {
      return res
        .status(429)
        .json({ message: "please wait before requesting a new otp" });
    }

    const otp = genOtp();
    myUser.otp = await bcrypt.hash(otp.toString(), SALT_ROUNDS);
    myUser.otpExpires = new Date(Date.now() + OTP_VT);
    myUser.lastOtpSent = new Date();

    await myUser.save();

    try {
      await sendOtp(email, otp);
    } catch (error) {
      console.log("error in email service", error.message || error);
      return res
        .status(500)
        .json({ message: "could not send otp at the moment" });
    }

    return res.status(200).json({ message: "reset request sent successfully" });
  } catch (error) {
    console.log(
      "error in password reset request controller",
      error.message || error
    );
    return res.status(500).json({ message: "internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    let { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res
        .status(400)
        .json({ message: "please enter the required fields" });
    }

    email = email.trim().toLowerCase();

    const myUser = await Users.findOne({ email }).select(
      "+otp +otpExpires +password"
    );
    if (!myUser) {
      return res.status(404).json({ message: "user not found" });
    }

    if (
      !myUser.otp ||
      !myUser.otpExpires ||
      Date.now() > new Date(myUser.otpExpires).getTime()
    ) {
      return res.status(422).json({ message: "invalid or expired otp" });
    }

    const verified = await bcrypt.compare(otp.toString(), myUser.otp);
    if (!verified) {
      return res.status(422).json({ message: "invalid otp" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    myUser.password = hashedPassword;
    myUser.otp = undefined;
    myUser.otpExpires = undefined;

    await myUser.save();

    res.clearCookie("jwt");

    return res
      .status(200)
      .json({ message: "password changed successfully, please re-login" });
  } catch (error) {
    console.log("error in reset password", error.message || error);
    return res.status(500).json({ message: "internal server error" });
  }
};
