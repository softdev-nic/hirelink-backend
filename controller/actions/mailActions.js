 const mail = require("../../Model/LinkSchema");

const ALLOWED_STATUSES = ["pending", "approved", "rejected"];

const toggleMailStatus = async (req, res) => {
  try {
    const { mailId, newStatus } = req.body;

    if (typeof mailId !== "string" || !ALLOWED_STATUSES.includes(newStatus)) {
      return res.status(400).json({ message: "A valid mailId and status are required" });
    }

    const Mail = await mail.findById(mailId);
    if (!Mail) {
      return res.status(404).json({ message: "Mail does not exist" });
    }

    Mail.status = newStatus;
    Mail.AttendedBy = req.user._id;

    if (newStatus === "approved") Mail.expiresAt = null;
    if (newStatus === "rejected") Mail.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await Mail.save();

    return res.status(200).json({ message: `Status changed to ${Mail.status}` });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { toggleMailStatus };