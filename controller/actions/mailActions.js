const mail = require("../../Model/LinkSchema")


const toggleMailStatus = async(req,res)=>{
    try{

        const {mailId, newStatus} = req.body
        const Mail = await mail.findById(mailId)
        if(!Mail){
            return res.status(400).json({message:"Mail does not exist"})
        }
        Mail.status = newStatus
        Mail.AttendedBy = req.user._id
        if(Mail.status === "approved")
            Mail.expiresAt = null
        if(Mail.status==="rejected")
            Mail.expiresAt = new Date(Date.now()+24*60*60*1000)
        Mail.save()
        
    }catch(error){
        res.status(500).json({error:error})
    }
}
module.exports = {toggleMailStatus}