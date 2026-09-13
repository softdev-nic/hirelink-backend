 const User = require("../../Model/Users");
const mailer = require("../../mailer");
const BannedUser = require("../../Model/BannedUsers");

const escapeHtml = (s = "") =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

const banUser = async (req, res) => {
  try {
    const { email, reason } = req.body;

    if (typeof email !== "string" || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({ message: "Email and reason are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existingUser.role === "superAdmin") {
      return res.status(403).json({ message: "A super admin cannot be banned" });
    }
    if (existingUser._id.equals(req.user._id)) {
      return res.status(400).json({ message: "You cannot ban yourself" });
    }

    await BannedUser.updateOne(
      { email: existingUser.email },
      {
        $setOnInsert: {
          email: existingUser.email,
          name: existingUser.name,
          reason: reason.trim(),
          bannedBy: req.user._id,
        },
      },
      { upsert: true }
    );

    try {
      await mailer.sendEmail(
        existingUser.email,
        "Regarding Banning",
        `<p>Hi ${escapeHtml(existingUser.name)}, your account has been banned for the following reason: ` +
          `${escapeHtml(reason.trim())}.</p>`
      );
    } catch (mailError) {
      console.error("Ban email failed:", mailError);
    }

    await User.findByIdAndDelete(existingUser._id);

    return res.status(200).json({ message: "User banned successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const bannedUser = await BannedUser.findOne({ email: email.toLowerCase().trim() });
    if (!bannedUser) {
      return res.status(404).json({ message: "Banned user not found" });
    }

    await BannedUser.findByIdAndDelete(bannedUser._id);

    try {
      await mailer.sendEmail(
        bannedUser.email,
        "Regarding Unbanning",
        `<p>Hi, your account has been unbanned. You can register again.</p>`
      );
    } catch (mailError) {
      console.error("Unban email failed:", mailError);
    }

    return res.status(200).json({ message: "User unbanned successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { banUser, unbanUser };