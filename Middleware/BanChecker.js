const bannedUser = require("../Model/BannedUsers");
const banChecker = async (req, res, next) => {
    const { email } = req.body;
  try {
    const existingBannedUser = await bannedUser.findOne({ email });
    if (existingBannedUser) {
      return res.status(403).json({ message: "User is banned" });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "User is banned" });
  }
};          

module.exports = banChecker;