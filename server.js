const express = require('express')
const connectDB = require("./db");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const registerController = require("./controller/Registration");
const authMiddleware = require("./Middleware/Auth");
const loginController = require("./controller/loginController");
const companyManagerController = require("./controller/companyManagerController");
const passwordManager = require("./controller/passwordManager");
const moderatorManager = require("./controller/moderatorManager");
const superAdminAuth = require("./Middleware/superAdminAuth"); 
const strictActions = require("./controller/actions/strictActions")
const bannedCheck = require("./Middleware/BanChecker");
const moderatorAuth = require('./Middleware/moderatorAuth')
const mailActions = require("./controller/actions/mailActions")
const domainCheck = require("./Middleware/domainValidation")
const templateManager = require("./controller/templateManager")
const emailVerification = require("./controller/emailVerification")
connectDB();

const app = express()
app.use(express.json())
app.use(cors())

app.post("/api/add-company",authMiddleware.authMiddleware,domainCheck,companyManagerController.addCompany);
app.get("/api/get-companies/:statusParameter",authMiddleware.authMiddleware,authMiddleware.filterValidation,companyManagerController.getCompanies);
app.delete("/api/delete-company-mail/:id",authMiddleware.authMiddleware,moderatorAuth.moderatorAuth,companyManagerController.deleteCompanyMail);
app.post("/api/upvote-company-mail/:id",authMiddleware.authMiddleware,companyManagerController.upvoteCompanyMail);
app.post("/api/change-mail-status",authMiddleware.authMiddleware,moderatorAuth.moderatorOnly,mailActions.toggleMailStatus)
app.post("/api/downvote-company-mail/:id",authMiddleware.authMiddleware,companyManagerController.downvoteCompanyMail);
app.post("/api/register",bannedCheck, registerController.registerUser);
app.post("/api/assign-moderator",authMiddleware.authMiddleware,moderatorManager.assignModerator);
app.post("/api/forgot-password", passwordManager.forgotPassword);
app.post("/api/reset-password/:token", passwordManager.resetPassword);
app.post("/api/report-mail/:id", authMiddleware.authMiddleware,companyManagerController.reportCompanyMail); 
app.post("/api/login", loginController.loginUser);  
app.post("/api/generate-otp", authMiddleware.authMiddleware, emailVerification.generateOTP);
app.post("/api/verify-otp", authMiddleware.authMiddleware, emailVerification.verifyOtp);
app.post("/api/ban-user", authMiddleware.authMiddleware,superAdminAuth, strictActions.banUser);
app.post("/api/unban-user", authMiddleware.authMiddleware, strictActions.unbanUser);
app.post("/api/template/add",authMiddleware.authMiddleware,templateManager.addTemplate)
app.get("/api/template/get",authMiddleware.authMiddleware,templateManager.getTemplate)
app.listen(process.env.PORT || 3000,()=>{
console.log("listening at " + (process.env.PORT || 3000))

})


