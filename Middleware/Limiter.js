const limiter = require("express-rate-limit");
("dotenv").config();
const skip = ()=> process.env.NODE_ENV !== "production";
const genereteLimiter = (skip, minutes,limit,message) => {
     return limiter({
        windowMs: minutes * 60* 60* 1000,
        max: limit,
        message: message,
        skip: skip
    }); 
}   


    module.exports = {
        authLimiter: genereteLimiter(skip, 24, 5, "Too many requests from this IP, please try again after 24 hours"),  
        otpLimiter: genereteLimiter(skip, 24, 3, "Too many OTP requests from this IP, please try again after 24 hours"),
        passwordResetLimiter: genereteLimiter(skip, 4, 3, "Too many password reset requests from this IP, please try again after 4 hours"),
        mailSubmissionLimiter: genereteLimiter(skip, 24, 10, "Too many mail submissions from this IP, please try again after 24 hours"),  
    }