 const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const skip = () => process.env.NODE_ENV !== "production";

const ipKey = (req) => ipKeyGenerator(req.ip);

const safeKey = (prefix, value, req) => {
  const key = value ? String(value).toLowerCase().trim() : null;
  return key ? `${prefix}:${key}` : `${prefix}:ip:${ipKey(req)}`;
};

const makeLimiter = ({ hours, limit, message, keyGenerator, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs: hours * 60 * 60 * 1000,
    limit,
    skip,
    skipSuccessfulRequests,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

const otpVerifyLimiter = makeLimiter({
  hours: 1,
  limit: 10,
  keyGenerator: (req) => safeKey("otp-verify", req.body.challengeId, req),
  message: "Too many OTP attempts. Request a new code.",
});

const otpResendLimiter = makeLimiter({
  hours: 1,
  limit: 3,
  keyGenerator: (req) => safeKey("otp-resend", req.body.email, req),
  message: "Too many code requests for this account. Try again later.",
});

const passwordResetLimiter = makeLimiter({
  hours: 1,
  limit: 3,
  keyGenerator: (req) => safeKey("reset", req.body.email, req),
  message: "Too many password reset requests for this account. Try again later.",
});

const authLimiter = makeLimiter({
  hours: 1,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => safeKey("login", req.body.email, req),
  message: "Too many failed login attempts for this account. Try again later.",
});

const ipFloodLimiter = makeLimiter({
  hours: 1,
  limit: 60,
  keyGenerator: (req) => `flood:${ipKey(req)}`,
  message: "Too many requests from this network. Try again later.",
});

const registerLimiter = makeLimiter({
  hours: 24,
  limit: 10,
  keyGenerator: (req) => `register:${ipKey(req)}`,
  message: "Too many accounts created from this network. Try again tomorrow.",
});

const mailSubmissionLimiter = makeLimiter({
  hours: 24,
  limit: 10,
  keyGenerator: (req) => `submit:${req.user._id.toString()}`,
  message: "Daily submission limit reached. Try again tomorrow.",
});

module.exports = {
  otpVerifyLimiter,
  otpResendLimiter,
  passwordResetLimiter,
  authLimiter,
  ipFloodLimiter,
  registerLimiter,
  mailSubmissionLimiter,
};