// user-controllers.js (updated with delete-account endpoints)
import bcrypt from "bcrypt";
import Users from "../models/user-models.js";
import { generateToken } from "../utils/token-utils.js";
import { sendOtp } from "../utils/email-utils.js";
import dotenv from "dotenv";
dotenv.config();

const OTP_VT = 5 * 60 * 1000;
const RESEND_CD = 30 * 1000;

const genOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const updateProfile = async (req, res) => {
  try {
    const { name, userName, avatar } = req.body;

    const myuser = req.user;
    if (!myuser) {
      return res.status(401).json({ message: "unauthorized user" });
    }

    if (userName && userName !== myuser.userName) {
      const duplicate = await Users.findOne({
        userName,
        _id: { $ne: myuser._id },
      });
      if (duplicate) {
        return res
          .status(409)
          .json({ message: "the user with Username already exists" });
      }
    }

    if (req.file) {
      myuser.avatar = req.file.path;
    } else if (avatar) {
      myuser.avatar = avatar;
    }

    myuser.name = name ?? myuser.name;
    myuser.userName = userName ?? myuser.userName;

    await myuser.save();
    return res.status(200).json({ message: "details updated successfully" });
  } catch (error) {
    console.log(`error in update profile route ${error.message || error}`);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const requestUpdateEmail = async (req, res) => {
  try {
    const myuser = req.user;
    if (!myuser) {
      return res.status(401).json({ message: "unauthorised user" });
    }

    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    if (email === myuser.email) {
      return res
        .status(400)
        .json({ message: "this is already your current email" });
    }

    const conflict = await Users.findOne({
      $or: [{ email }, { pendingEmail: email }],
      _id: { $ne: myuser._id },
    });
    if (conflict) {
      return res.status(409).json({ message: "email already registered" });
    }

    const fullUser = await Users.findById(myuser._id).select(
      "+password +lastOtpSent +otp +otpExpires +pendingEmail"
    );
    if (!fullUser) {
      return res.status(401).json({ message: "unauthorised user" });
    }

    const passverify = await bcrypt.compare(password, fullUser.password);
    if (!passverify) {
      return res
        .status(400)
        .json({ message: "please enter the correct password" });
    }

    if (
      fullUser.lastOtpSent &&
      Date.now() - fullUser.lastOtpSent.getTime() < RESEND_CD
    ) {
      return res.status(429).json({
        message: "please wait before requesting a new otp",
      });
    }

    const otp = genOtp();

    try {
      await sendOtp(email, otp);
    } catch (error) {
      console.log(`error in email service ${error.message || error}`);
      return res.status(500).json({ message: "please request otp again" });
    }

    const hashedOtp = await bcrypt.hash(otp.toString(), 10);
    fullUser.otp = hashedOtp;
    fullUser.otpExpires = new Date(Date.now() + OTP_VT);
    fullUser.pendingEmail = email;
    fullUser.lastOtpSent = new Date();

    await fullUser.save();

    return res
      .status(200)
      .json({ message: "otp sent to new email, please verify" });
  } catch (error) {
    console.log(
      `error in request update email route ${error.message || error}`
    );
    return res.status(500).json({ message: "internal server error" });
  }
};

export const updateEmail = async (req, res) => {
  try {
    const myuser = req.user;
    if (!myuser) {
      return res.status(401).json({ message: "unauthorised user" });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "otp is required" });
    }

    const fullUser = await Users.findById(myuser._id).select(
      "+otp +otpExpires +pendingEmail"
    );
    if (!fullUser) {
      return res.status(401).json({ message: "unauthorised user" });
    }

    if (!fullUser.pendingEmail) {
      return res.status(400).json({ message: "no pending email change" });
    }

    if (
      !fullUser.otp ||
      !fullUser.otpExpires ||
      Date.now() > new Date(fullUser.otpExpires).getTime()
    ) {
      fullUser.otp = undefined;
      fullUser.otpExpires = undefined;
      fullUser.pendingEmail = undefined;
      await fullUser.save();
      return res
        .status(422)
        .json({ message: "please enter the valid otp or request new otp" });
    }

    const match = await bcrypt.compare(otp.toString(), fullUser.otp);
    if (!match) {
      return res.status(422).json({ message: "please enter the correct otp" });
    }

    const conflict = await Users.findOne({
      $or: [
        { email: fullUser.pendingEmail },
        { pendingEmail: fullUser.pendingEmail },
      ],
      _id: { $ne: fullUser._id },
    });
    if (conflict) {
      fullUser.otp = undefined;
      fullUser.otpExpires = undefined;
      fullUser.pendingEmail = undefined;
      await fullUser.save();
      return res.status(409).json({ message: "email already registered" });
    }

    fullUser.email = fullUser.pendingEmail;
    fullUser.pendingEmail = undefined;
    fullUser.isVerified = true;
    fullUser.otp = undefined;
    fullUser.otpExpires = undefined;
    await fullUser.save();

    const token = generateToken(fullUser._id, res);

    return res.status(200).json({
      message: "email updated sucessfully",
      myuser: {
        _id: fullUser._id,
        email: fullUser.email,
      },
      token,
    });
  } catch (error) {
    console.log(`error in updateEmail ${error.message || error}`);
    return res.status(500).json({ message: "internal server error" });
  }
};
export const getUserByUsername = async (req, res) => {
  try {
    const requester = req.user;

    if (!requester) {
      return res.status(401).json({ message: "unauthorised user" });
    }

    const { userName } = req.query;
    if (!userName || typeof userName !== "string" || !userName.trim()) {
      return res.status(400).json({ message: "username is required" });
    }

    // 🔥 normalize input to match how it's stored in DB
    const username = userName.trim().toLowerCase();

    const foundUser = await Users.findOne({ userName: username }).lean();

    if (!foundUser) {
      return res.status(404).json({ message: "user not found" });
    }

    if (foundUser._id.toString() === requester._id.toString()) {
      return res.status(400).json({ message: "cannot search yourself" });
    }

    return res.status(200).json({
      message: "user found",
      user: foundUser,
    });
  } catch (error) {
    console.error("Error in getUserByUsername:", error);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const resendUpdateEmailOtp = async (req,res)=>{
    try {
        const myuser=req.user;
        if(!myuser){
            return res.status(401).json({message:"unauthorised user"});
        }

        const fullUser=await Users.findById(myuser._id).select("+pendingEmail +lastOtpSent");
        if(!fullUser){
            return res.status(401).json({message:"unauthorised user"});
        }

        if(!fullUser.pendingEmail){
            return res.status(400).json({message:"no pending email change"});
        }

        if(
            fullUser.lastOtpSent
            && Date.now()-fullUser.lastOtpSent.getTime()<RESEND_CD
        ){
            return res.status(429).json({message:"please wait before requesting new otp"});
        }

        const otp=genOtp();

        try{
            await sendOtp(fullUser.pendingEmail,otp);
        }catch(error){
            console.log(`error in email service ${error.message||error}`);
            return res.status(500).json({message:"please request otp again"});
        }

        const hashedOtp=await bcrypt.hash(otp.toString(),10);

        fullUser.otp=hashedOtp;
        fullUser.otpExpires=new Date(Date.now()+OTP_VT);
        fullUser.lastOtpSent=new Date();

        await fullUser.save();

        return res.status(200).json({message:"otp resent"});
    } catch (error) {
        console.log(`error in resend otp route ${error.message||error}`);
        return res.status(500).json({message:"internal server error"});
    }
};

// delete-account: request otp (requires password) and confirm delete
export const requestDeleteAccount = async (req, res) => {
  try {
    const myuser = req.user;
    if (!myuser) {
      return res.status(401).json({ message: "unauthorised user" });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "password is required" });
    }

    const fullUser = await Users.findById(myuser._id).select(
      "+password +lastOtpSent +otp +otpExpires +email"
    );
    if (!fullUser) {
      return res.status(401).json({ message: "unauthorised user" });
    }

    const passverify = await bcrypt.compare(password, fullUser.password);
    if (!passverify) {
      return res.status(400).json({ message: "please enter the correct password" });
    }

    if (
      fullUser.lastOtpSent &&
      Date.now() - fullUser.lastOtpSent.getTime() < RESEND_CD
    ) {
      return res.status(429).json({ message: "please wait before requesting a new otp" });
    }

    const otp = genOtp();

    try {
      await sendOtp(fullUser.email, otp);
    } catch (error) {
      console.log(`error in email service ${error.message || error}`);
      return res.status(500).json({ message: "please request otp again" });
    }

    fullUser.otp = await bcrypt.hash(otp.toString(), 10);
    fullUser.otpExpires = new Date(Date.now() + OTP_VT);
    fullUser.lastOtpSent = new Date();

    await fullUser.save();

    return res.status(200).json({ message: "otp sent to your email, confirm to delete account" });
  } catch (error) {
    console.log(`error in request delete account ${error.message || error}`);
    return res.status(500).json({ message: "internal server error" });
  }
};

export const confirmDeleteAccount = async (req, res) => {
  try {
    const myuser = req.user;
    if (!myuser) {
      return res.status(401).json({ message: "unauthorised user" });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "otp is required" });
    }

    const fullUser = await Users.findById(myuser._id).select(
      "+otp +otpExpires"
    );
    if (!fullUser) {
      return res.status(401).json({ message: "unauthorised user" });
    }

    if (
      !fullUser.otp ||
      !fullUser.otpExpires ||
      Date.now() > new Date(fullUser.otpExpires).getTime()
    ) {
      fullUser.otp = undefined;
      fullUser.otpExpires = undefined;
      await fullUser.save();
      return res.status(422).json({ message: "invalid or expired otp" });
    }

    const verified = await bcrypt.compare(otp.toString(), fullUser.otp);
    if (!verified) {
      return res.status(422).json({ message: "invalid otp" });
    }

    await Users.deleteOne({ _id: fullUser._id });

    res.clearCookie("jwt");

    return res.status(200).json({ message: "account deleted successfully" });
  } catch (error) {
    console.log(`error in confirm delete account ${error.message || error}`);
    return res.status(500).json({ message: "internal server error" });
  }
};
