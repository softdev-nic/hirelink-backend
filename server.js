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
connectDB();

const app = express()
app.use(express.json())
app.use(cors())

app.post("/api/add-company",authMiddleware,companyManagerController.addCompany);
app.get("/api/get-companies",authMiddleware,companyManagerController.getCompanies);
app.delete("/api/delete-company-mail/:id",authMiddleware,moderatorAuth.moderatorAuth,companyManagerController.deleteCompanyMail);
app.post("/api/upvote-company-mail/:id",authMiddleware,companyManagerController.upvoteCompanyMail);
app.post("/api/chamge-mail-status",authMiddleware,moderatorAuth.moderatorOnly,mailActions.toggleMailStatus)
app.post("/api/downvote-company-mail/:id",authMiddleware,companyManagerController.downvoteCompanyMail);
app.post("/api/register",bannedCheck, registerController.registerUser);
app.post("/api/assign-moderator",authMiddleware,moderatorManager.assignModerator);
app.post("/api/forgot-password", passwordManager.forgotPassword);
app.post("/api/reset-password/:token", passwordManager.resetPassword);
app.post("/api/report-mail/:id", authMiddleware,companyManagerController.reportCompanyMail); 
app.post("/api/login", loginController.loginUser);  
app.post("/api/ban-user", authMiddleware,superAdminAuth, strictActions.banUser);
app.post("/api/unban-user", authMiddleware, strictActions.unbanUser);
app.listen(process.env.PORT || 3000,()=>{
console.log("listening at " + (process.env.PORT || 3000))

})


