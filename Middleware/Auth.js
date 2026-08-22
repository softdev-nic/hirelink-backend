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

const filterValidation = async(req,res,next)=>{
  const USER = await User.findById(req.user._id)

  if(USER.role!=="moderator" && USER.role!=="superAdmin" &&req.params.statusParameter!=="approved"){
    return res.status(403).json({message:"This is invalid filter for this tier"})
  }
  next()
}
module.exports = {authMiddleware,filterValidation};    