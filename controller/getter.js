const user = require("../Model/Users")

const getRole = async(req,res)=>{
    try{

        const  User = await user.findById(req.user._id)
        return res.json({role:User.role})

    }catch(error){return res.status(500).json({error:error.message})}
}


module.exports = {getRole}