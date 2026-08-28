const user = require("../Model/Users")
const crypto = require("crypto")
const mailer = require("../mailer")

const generateOTP = async(user)=>{
    try{
        const existingUser = await user.findBy({email})
      

        const otp = crypto.randomInt(100000,1000000).toString()
        const challengeId = crypto.randomUUID()
        const otpExpiresAt = new Date(Date.now()+5*60*1000)
        existingUser.challengeId=challengeId
        existingUser.otp=otp
        existingUser.otpExpiresAt = otpExpiresAt
        await existingUser.save()
        await mailer.sendEmail(existingUser.email, "Your HireLink verification code", `Hi ${existingUser.name}, your verification code is ${otp}. It expires in 5 minutes.`)

        return  {message:"OTP sent successfully to your registered email" ,params:challengeId}
    }catch(error){
        return {
            message:error.message
        }
    }
}

const verifyOtp = async(req,res)=>{
    try{
        const {otp} = req.body
        if(!/^\d{6}$/.test(otp.toString())){
            return res.status(400).json({message:"A 6-digit OTP is required"})
        }

        const existingUser = await user.findOne({
            otp: otp.toString(),
            otpExpiresAt: {$gt: Date.now()}
        })
        if(!existingUser){
            return res.status(400).json({message:"invalid OTP"})
        }

        existingUser.isVerified = true
        existingUser.otp = null
        existingUser.otpExpiresAt = null
        await existingUser.save()

        return res.status(200).json({message:"Email verified successfully"})
    }catch(error){
        return res.status(500).json({message:error.message})
    }
}

module.exports = {generateOTP, verifyOtp}


