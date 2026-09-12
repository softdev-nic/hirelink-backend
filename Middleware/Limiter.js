 const rateLimit = require("express-rate-limit");

const skip = () => process.env.NODE_ENV !== "production";

const makeLimiter = ({ hours, limit, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs: hours * 60 * 60 * 1000,
    limit,
    skip,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

module.exports = {
  
  authLimiter: makeLimiter({
    hours: 1,
    limit: 15,
    skipSuccessfulRequests: true,
    message: "Too many failed login attempts. Try again later.",
  }),
  registerLimiter: makeLimiter({
    hours: 1,
    limit: 5,
    message: "Too many accounts created from this network. Try again later.",
  }),
  otpLimiter: makeLimiter({
    hours: 24,
    limit: 5,
    message: "Too many OTP attempts. Try again later.",
  }),
  passwordResetLimiter: makeLimiter({
    hours: 24,
    limit: 5,
    message: "Too many password reset requests. Try again later.",
  }),
  mailSubmissionLimiter: makeLimiter({
    hours: 24,
    limit: 10,
    message: "Too many submissions. Try again later.",
  }),
};