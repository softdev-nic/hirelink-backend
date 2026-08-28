const user = require("../Model/Users");
const bcrypt = require("bcryptjs");
const emailVerification = require("../controller/emailVerification")
const bannedUser = require("../Model/BannedUsers");
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const existingBannedUser = await bannedUser.findOne({ email });
    if (existingBannedUser) {
      return res.status(400).json({ message: "User is banned" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new user({ name, email, password: hashedPassword });
    await newUser.save();
   const newChallengeId = await emailVerification.generateOTP(newUser)
    res.status(201).json({ message: "User registered successfully", user: newUser, challengeId:newChallengeId.params});
return
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerUser };  