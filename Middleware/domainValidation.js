const validDomain = require("../Model/ValidDomains")
const dns = require("dns").promises

const checkDomain = async(req,res,next)=>{
    try{

        const {companyName,email} = req.body
        
        const domain = email.split("@")[1].toLowerCase()

    const Exists = await validDomain.findOne({domain})

    if(Exists){
        return next()
    }
    const mxRecords = await  dns.resolveMx(domain)
    if(!mxRecords.length)
        {
        return res.status(400).json({message:"domain does not have a mail server"})
    }

   await validDomain.create({
    domain,
    companyName
   })
    next()
}catch(error)
{
    return res.status(500).json({error: error.message})
}

}
module.exports= checkDomain