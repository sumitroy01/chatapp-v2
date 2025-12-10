import sendgrid from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM = process.env.SENDGRID_EMAIL;

if (!SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not set. Email service will not work.");
} else {
  sendgrid.setApiKey(SENDGRID_API_KEY);
  console.log("SendGrid initialized");
}

if (!FROM) {
  console.warn("SENDGRID_FROM (SENDGRID_EMAIL) not set. Outgoing emails may fail or be rejected.");
}

function ensureEmailConfig() {
  if (!SENDGRID_API_KEY) {
    throw new Error("Email service is not configured (SENDGRID_API_KEY missing)");
  }
  if (!FROM) {
    throw new Error("Email FROM address is not configured (SENDGRID_EMAIL missing)");
  }
}


export async function sendOtp(to, otp) {
  ensureEmailConfig();

  if (!to) throw new Error("Missing recipient email (to)");
  if (!otp) throw new Error("Missing OTP value");

  const msg = {
    to,
    from: FROM,
    subject: "Your Yapyap verification code",
    text: `Your OTP is ${otp}. It expires in 5 minutes.`,
    html: `
      <div style="
        max-width:420px;
        margin:2rem auto;
        background-color:#324343;
        padding:2rem;
        border-radius:12px;
        color:#d46b1b;
        text-align:center;
      ">
        <h1 style="font-style:oblique;margin-bottom:1.5rem;color:#fff;">
          Welcome to Yapyap 💌
        </h1>
        <div style="font-size:1rem;line-height:1.6;color:#f2c295;">
          <p>Your OTP is: <strong style="font-size:1.4rem;color:#fff;">${otp}</strong></p>
          <p>This code expires in 5 minutes.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  };

  try {
  
    const res = await sendgrid.send(msg);
    console.log(`OTP email queued to ${to} [status ${res?.[0]?.statusCode}]`);
    return res;
  } catch (error) {
    console.error(`Failed to send OTP to ${to}:`, error?.message || error);
    throw new Error("Failed to send OTP email");
  }
}

export async function sendGenEmail({ to, subject, text, html }) {
  ensureEmailConfig();

  if (!to || !subject || (!text && !html)) {
    throw new Error("Invalid parameters for sendGenEmail");
  }

  const msg = { to, from: FROM, subject, text, html };

  try {
    const res = await sendgrid.send(msg);
    console.log(`Generic email queued to ${to} [status ${res?.[0]?.statusCode}]`);
    return res;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error?.message || error);
    throw new Error("Failed to send email");
  }
}

export default { sendOtp, sendGenEmail };
