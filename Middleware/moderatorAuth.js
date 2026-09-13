 const mail = require("../Model/LinkSchema");

const moderatorAuth = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Mail = await mail.findById(id);
    if (!Mail) {
      return res.status(404).json({ message: "Mail does not exist" });
    }

    const isCreator = Mail.postedBy && Mail.postedBy.equals(req.user._id);
    const isModerator = req.user.role === "moderator" || req.user.role === "superAdmin";

    if (!isCreator && !isModerator) {
      return res.status(403).json({ message: "Access denied. Moderator or creator only." });
    }

    req.mail = Mail;
    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const moderatorOnly = (req, res, next) => {
  if (req.user.role !== "moderator" && req.user.role !== "superAdmin") {
    return res.status(403).json({ message: "Access denied. Moderator only." });
  }
  next();
};

const moderatorcheck = (req, res) => {
  const isModerator = req.user.role === "moderator" || req.user.role === "superAdmin";
  if (!isModerator) {
    return res.status(403).json({ message: "Access denied. Moderator only." });
  }
  return res.status(200).json({ isModerator: true, role: req.user.role });
};

module.exports = { moderatorAuth, moderatorOnly, moderatorcheck };