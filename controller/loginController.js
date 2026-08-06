const user = require("../Model/Users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, existingUser.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({ message: "Login successful", user: existingUser, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { loginUser }; 