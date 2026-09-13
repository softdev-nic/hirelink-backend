 const bannedUser = require("../Model/BannedUsers");

const banChecker = async (req, res, next) => {
  const { email } = req.body;
  try {
    if (typeof email !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const existingBannedUser = await bannedUser.findOne({ email: email.toLowerCase().trim() });
    if (existingBannedUser) {
      return res.status(403).json({ message: "User is banned" });
    }
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = banChecker;