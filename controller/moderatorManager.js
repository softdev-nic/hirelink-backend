const user = require("../Model/Users");



const selectModerator = async (req, res) => {  
    try {
        const { email } = req.body;
        const existingUser = await user.findOne({ email }); 
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        existingUser.isModerator = true; 
        existingUser.moderatorSelectedBy = req.user._id;
        extistinguser.role="moderator"
        await existingUser.save();
        res.status(200).json({ message: "User selected as moderator successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { selectModerator };      