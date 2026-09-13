 const User = require("../Model/Users");
const crypto = require("crypto");
const mailer = require("../mailer");
const bcrypt = require("bcryptjs");

const escapeHtml = (s = "") =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const forgotPassword = async (req, res) => {
  const generic = { message: "If that account exists, a reset link has been sent." };
  try {
    const { email } = req.body;
    if (typeof email !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!existingUser) {
      return res.status(200).json(generic);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    existingUser.resetPasswordToken = hashToken(resetToken);
    existingUser.resetPasswordExpires = Date.now() + 5 * 60 * 1000;
    await existingUser.save();

    const link = `https://hirelink.atmex.site/reset-password/${resetToken}`;
    await mailer.sendEmail(
      existingUser.email,
      "Password Reset",
      `<p>Hi ${escapeHtml(existingUser.name)}, you requested a password reset. ` +
        `<a href="${link}">Click here to reset your password</a>. This link expires in 5 minutes.</p>`
    );

    return res.status(200).json(generic);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (typeof token !== "string" || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "A new password of at least 8 characters is required" });
    }

    const existingUser = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!existingUser) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    existingUser.password = await bcrypt.hash(password, 10);
    existingUser.resetPasswordToken = null;
    existingUser.resetPasswordExpires = null;
    existingUser.passwordChangedAt = new Date();
    await existingUser.save();

    await mailer.sendEmail(
      existingUser.email,
      "Password Reset Successful",
      `<p>Hi ${escapeHtml(existingUser.name)}, your password has been reset. ` +
        `If you did not do this, contact support immediately.</p>`
    );

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { forgotPassword, resetPassword };