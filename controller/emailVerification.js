 const User = require("../Model/Users");
const crypto = require("crypto");
const mailer = require("../mailer");

const MAX_ATTEMPTS = 5;
const OTP_TTL_MS = 5 * 60 * 1000;

const escapeHtml = (s = "") =>
  s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const generateOTP = async (userDoc) => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const challengeId = crypto.randomUUID();

  userDoc.otpChallenge = {
    challengeId,
    otp,
    otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
    attempts: 0,
  };
  await userDoc.save();

  await mailer.sendEmail(
    userDoc.email,
    "Your HireLink verification code",
    `<p>Hi ${escapeHtml(userDoc.name)}, your verification code is <b>${otp}</b>. It expires in 5 minutes.</p>`
  );

  return challengeId;
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    const generic = { message: "If that account exists and is unverified, a new code has been sent." };

    if (!existingUser || existingUser.isVerified) {
      return res.status(200).json(generic);
    }

    const challengeId = await generateOTP(existingUser);
    return res.status(200).json({ ...generic, challengeId });
  } catch (error) {
    console.error("resendOtp error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp, challengeId } = req.body;
    if (typeof otp !== "string" || !/^\d{6}$/.test(otp) || typeof challengeId !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const existingUser = await User.findOne({ "otpChallenge.challengeId": challengeId });
    const ch = existingUser?.otpChallenge;

    if (!ch?.otp || !ch.otpExpiresAt || ch.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const match = crypto.timingSafeEqual(Buffer.from(ch.otp), Buffer.from(otp));
    if (!match) {
      ch.attempts += 1;
      if (ch.attempts >= MAX_ATTEMPTS) {
        ch.otp = null;
        ch.challengeId = null;
      }
      await existingUser.save();
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    existingUser.isVerified = true;
    existingUser.otpChallenge = { challengeId: null, otp: null, otpExpiresAt: null, attempts: 0 };
    await existingUser.save();

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { generateOTP, verifyOtp, resendOtp };