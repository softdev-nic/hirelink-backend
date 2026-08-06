const user = require("../Model/Users");
const mailer = require("../mailer")


const assignModerator = async (req, res) => {  
    try {
        const { email } = req.body;
        const existingUser = await user.findOne({ email }); 
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        existingUser.isModerator = true; 
        existingUser.moderatorSelectedBy = req.user._id;
        existingUser.role = "moderator";
        await existingUser.save();
        await mailer.sendEmail(existingUser.email, "Regarding Moderator Selection", ` Hi ${existingUser.name}, We are hereby pleased to inform you that you have been selected as a moderator. Please log in to your account.`);
        res.status(200).json({ message: "User selected as moderator successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { assignModerator };      