const User = require("../Model/Users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Invalid request" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    const invalid = () => res.status(401).json({ message: "Invalid email or password" });

    if (!existingUser) {
      await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidre");
      return invalid();
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) {
      return invalid();
    }

    if (!existingUser.isVerified) {
      return res.status(403).json({ message: "Please verify your email before logging in", needsVerification: true });
    }

    const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
      algorithm: "HS256",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        isModerator: existingUser.isModerator,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { loginUser };