import jwt from "jsonwebtoken";

export function generateToken(userId, res = null, opts = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set in env");

  const expiresInSec = opts.expiresInSec || Number(process.env.JWT_EXPIRES_IN_SEC) || 60 * 60 * 24 * 7; // default 7 days
  const token = jwt.sign({ userId: String(userId) }, secret, { expiresIn: expiresInSec });

  if (res) {
    const defaultCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 2*24*60*60*1000,
      path: "/", 
    };

    const cookieOptions = { ...defaultCookieOptions, ...(opts.cookieOptions || {}) };
    res.cookie("jwt", token, cookieOptions);
  }

  return token;
}
