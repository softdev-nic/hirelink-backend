 const User = require("../Model/Users");
const bcrypt = require("bcryptjs");
const emailVerification = require("./emailVerification");
const bannedUser = require("../Model/BannedUsers");

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
      return res.status(400).json({ message: "Name, valid email and 8+ character password required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const existingBannedUser = await bannedUser.findOne({ email });
    if (existingBannedUser) {
      return res.status(400).json({ message: "User is banned" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name: name.trim(), email, password: hashedPassword });
    await newUser.save();

    let challengeId = null;
    try {
      challengeId = await emailVerification.generateOTP(newUser);
    } catch (otpError) {
      console.error("OTP send failed for", email, otpError);
    }

    return res.status(201).json({
      message: challengeId
        ? "User registered successfully. Check your email for the verification code."
        : "User registered, but the verification email could not be sent. Please request a new code.",
      challengeId,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser };