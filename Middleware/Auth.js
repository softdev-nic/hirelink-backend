 const jwt = require("jsonwebtoken");
const User = require("../Model/Users");

const authMiddleware = async (req, res, next) => {
  const header = req.header("Authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const currentUser = await User.findById(decoded.userId).select("-password");

    if (!currentUser) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    if (currentUser.passwordChangedAt && decoded.iat * 1000 < currentUser.passwordChangedAt.getTime()) {
      return res.status(401).json({ message: "Session expired, please log in again" });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

const filterValidation = (req, res, next) => {
  const { role } = req.user;
  if (role !== "moderator" && role !== "superAdmin" && req.params.statusParameter !== "approved") {
    return res.status(403).json({ message: "This is an invalid filter for this tier" });
  }
  next();
};

module.exports = { authMiddleware, filterValidation };