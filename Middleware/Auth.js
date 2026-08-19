const jwt = require("jsonwebtoken");
const User = require("../Model/Users");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")
 if(!token){
    return res.status(401).json({ message: "No token, authorization denied" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select("-password");
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = authMiddleware;    