// backend/utils/sendEmail.js
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.EMAIL_FROM || "DonateUs <familybackup2580@gmail.com>";

if (!SENDGRID_API_KEY) {
  console.warn("⚠️ SENDGRID_API_KEY not set — emails will fail until configured.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("✅ SendGrid initialized");
}

export async function sendOtp(to, otp) {
  if (!SENDGRID_API_KEY) throw new Error("SENDGRID_API_KEY missing");

  const msg = {
    to,
    from: FROM, 
    subject: "Your YapYap Verification code",
    text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
    html: `
      <div style="font-family:sans-serif;line-height:1.5">
        <h2>Welcome to YapYap :🗣️</h2>
        <p>Your OTP is:</p>
        <h1 style="color:#007bff;">${otp}</h1>
        <p>This code expires in <strong>5 minutes</strong>.</p>
        <br/>
        <p>If you didn’t request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    const res = await sgMail.send(msg);
    console.log(`✅ OTP email sent to ${to} [status ${res[0]?.statusCode}]`);
    return res;
  } catch (error) {
    console.error(`❌ SendGrid send error for ${to}:`, error.response?.body || error.message);
    throw new Error("Failed to send OTP email");
  }
}


export async function sendGenericEmail({ to, subject, text, html }) {
  if (!SENDGRID_API_KEY) throw new Error("SENDGRID_API_KEY missing");

  const msg = {
    to,
    from: FROM,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  };

  try {
    const res = await sgMail.send(msg);
    console.log(`✅ Generic email sent to ${to} [status ${res[0]?.statusCode}]`);
    return res;
  } catch (error) {
    console.error(`❌ SendGrid generic send error for ${to}:`, error.response?.body || error.message);
    throw new Error("Failed to send email");
  }
}

export default { sendOtp, sendGenericEmail };
