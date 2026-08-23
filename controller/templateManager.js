const user = require("../Model/Users")
const addTemplate= async(req,res)=>{
    const {subject,text} = req.body
    try{
    const User = await user.findById(req.user._id)
    if(!User){
        return res.status(403).json({message:"user not found"})
    }
    User.template.subject = subject
    User.template.text    = text
    await User.save()
    res.status(201).json({message:"template added successfully"})
}catch(error)
{
    return res.status(500).json({error:error.message})
}
}

const getTemplate = async(req,res)=>{
    try{

        const template = await  user.findById(req.user._id).select("template")
        return res.status(201).json({template})
    }catch(error){
    return res.status(500).json({error:error.message})
    }

}

module.exports= {addTemplate,getTemplate}