const mail = require("../Model/LinkSchema");
const { findById } = require("../Model/Users");
const isCreator = require("./creatorAuth");
const moderatorAuth = async(req, res, next) => {
const {id} = req.params

const Mail = await mail.findById(id)
if(!Mail){
    return res.status(400).json({message:"mail does not exist"})
}

const creatorCheck = (req.user._id.toString()===Mail.postedBy.toString()) ?true:false

    if (!req.user || req.user.role !== "moderator" && req.user.role !== "superAdmin" || !creatorCheck   ) {
        return res.status(403).json({ message: "Access denied. Moderator or creator only." });
    }
    next();
};
 const moderatorOnly = (req,res,next)=>{ 
     if (req.user.role !== "moderator" && req.user.role !== "superAdmin"  ) {
        return res.status(403).json({ message: "Access denied. Moderator only." });
    }
    next()

 }
  const moderatorcheck = (req,res)=>{ 
     if (req.user.role !== "moderator" && req.user.role !== "superAdmin"  ) {
        return res.status(403).json({ message: "Access denied. Moderator only." });
    }
  

 }
module.exports =  {moderatorAuth,moderatorOnly,moderatorcheck} ; 