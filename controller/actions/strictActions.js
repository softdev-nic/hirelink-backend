const user = require("../../Model/Users");
const mailer = require("../../mailer")
const BannedUser = require("../../Model/BannedUsers");
const banUser = async (req, res) => {
    try {
        const { email, reason } = req.body;
        const existingUser = await user.findOne({ email });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const bannedUser = new BannedUser({
            email: existingUser.email,
            reason,
            bannedBy: req.user._id
        });
        await bannedUser.save();
        await user.findByIdAndDelete(existingUser._id);

        await mailer.sendEmail(existingUser.email, "Regarding Banning", ` Hi ${existingUser.name}, We are hereby informing you that your account has been banned for the following reason: ${reason}. Please log in to your account.`);
        res.status(200).json({ message: "User banned successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const unbanUser = async (req, res) => {
    try {
        const { email } = req.body;
        const bannedUser = await BannedUser.findOne({ email });
        if (!bannedUser) {
            return res.status(404).json({ message: "Banned user not found" });
        }
        await BannedUser.findByIdAndDelete(bannedUser._id);
        
        res.status(200).json({ message: "User unbanned successfully" });
        await mailer.sendEmail(bannedUser.email, "Regarding Unbanning", ` Hi, We are hereby informing you that your account has been unbanned. Please log in to your account.`);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { banUser, unbanUser };