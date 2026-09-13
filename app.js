const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const registerController = require("./controller/Registration");
const authMiddleware = require("./Middleware/Auth");
const loginController = require("./controller/loginController");
const companyManagerController = require("./controller/companyManagerController");
const passwordManager = require("./controller/passwordManager");
const moderatorManager = require("./controller/moderatorManager");
const superAdminAuth = require("./Middleware/superAdminAuth");
const strictActions = require("./controller/actions/strictActions");
const bannedCheck = require("./Middleware/BanChecker");
const moderatorAuth = require("./Middleware/moderatorAuth");
const mailActions = require("./controller/actions/mailActions");
const domainCheck = require("./Middleware/domainValidation");
const templateManager = require("./controller/templateManager");
const emailVerification = require("./controller/emailVerification");
const getter = require("./controller/getter");
const limiter = require("./Middleware/Limiter");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json({ limit: "100kb" }));

const allowedOrigins = [
  "https://hirelink.atmex.site",
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5173"] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);

app.post("/api/register", limiter.registerLimiter, bannedCheck, registerController.registerUser);
app.post("/api/login", limiter.authLimiter, limiter.ipFloodLimiter, loginController.loginUser);
app.post("/api/forgot-password", limiter.passwordResetLimiter, limiter.ipFloodLimiter, passwordManager.forgotPassword);
app.post("/api/reset-password/:token", limiter.ipFloodLimiter, passwordManager.resetPassword);

app.post("/api/otp/verify", limiter.otpVerifyLimiter, limiter.ipFloodLimiter, emailVerification.verifyOtp);
app.post("/api/otp/resend", limiter.otpResendLimiter, limiter.ipFloodLimiter, emailVerification.resendOtp);

app.post("/api/add-company", authMiddleware.authMiddleware, limiter.mailSubmissionLimiter, domainCheck, companyManagerController.addCompany);
app.get("/api/get-companies/:statusParameter", authMiddleware.authMiddleware, authMiddleware.filterValidation, companyManagerController.getCompanies);
app.post("/api/upvote-company-mail/:id", authMiddleware.authMiddleware, companyManagerController.upvoteCompanyMail);
app.post("/api/downvote-company-mail/:id", authMiddleware.authMiddleware, companyManagerController.downvoteCompanyMail);
app.post("/api/report-mail/:id", authMiddleware.authMiddleware, companyManagerController.reportCompanyMail);
app.delete("/api/delete-company-mail/:id", authMiddleware.authMiddleware, moderatorAuth.moderatorAuth, companyManagerController.deleteCompanyMail);
app.post("/api/template/add", authMiddleware.authMiddleware, templateManager.addTemplate);
app.get("/api/template/get", authMiddleware.authMiddleware, templateManager.getTemplate);
app.get("/api/role", authMiddleware.authMiddleware, getter.getRole);
app.get("/api/moderator-check", authMiddleware.authMiddleware, moderatorAuth.moderatorcheck);

app.post("/api/change-mail-status", authMiddleware.authMiddleware, moderatorAuth.moderatorOnly, mailActions.toggleMailStatus);

app.post("/api/assign-moderator", authMiddleware.authMiddleware, superAdminAuth, moderatorManager.assignModerator);
app.post("/api/demote-moderator", authMiddleware.authMiddleware, superAdminAuth, moderatorManager.demoteModerator);
app.post("/api/ban-user", authMiddleware.authMiddleware, superAdminAuth, strictActions.banUser);
app.post("/api/unban-user", authMiddleware.authMiddleware, superAdminAuth, strictActions.unbanUser);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed" });
  }
  res.status(500).json({ message: "Server error" });
});

module.exports = app;