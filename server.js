const express = require('express')
const connectDB = require("./db");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const registerController = require("./controller/Registration");
const authMiddleware = require("./Middleware/Auth");
const loginController = require("./controller/loginController");
const companyManagerController = require("./controller/companyManagerController");
connectDB();

const app = express()
app.use(express.json())
app.use(cors())

app.post("/api/add-company",authMiddleware,companyManagerController.addCompany);
app.get("/api/get-companies",authMiddleware,companyManagerController.getCompanies);
app.delete("/api/delete-company-mail/:id",authMiddleware,companyManagerController.deleteCompanyMail);
app.post("/api/upvote-company-mail/:id",authMiddleware,companyManagerController.upvoteCompanyMail);
app.post("/api/downvote-company-mail/:id",authMiddleware,companyManagerController.downvoteCompanyMail);
app.post("/api/register", registerController.registerUser);
app.post("/api/login", loginController.loginUser);  
app.listen(process.env.PORT || 3000,()=>{
console.log("listening at " + (process.env.PORT || 3000))

})


