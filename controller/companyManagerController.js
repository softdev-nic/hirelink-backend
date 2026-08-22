const Mail = require("../Model/LinkSchema");
const user = require("../Model/Users");
const addCompany = async (req, res) => {
    try {
        const { companyName, email } = req.body;
        if(!companyName || !email) {
            return res.status(400).json({ message: "Company name and email are required" });
        }
    const existingCompany = await  Mail.findOne({
        $or:[{email},{companyName}]
    })
    if (existingCompany) {
      return res.status(400).json({ message: "Company already exists" });
    }
    const newCompany = new Mail({ companyName, email, postedBy: req.user._id, expiresAt:new Date(Date.now()+3*24*60*60*1000 )});
    await newCompany.save();
    res.status(201).json({ message: "Company added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getCompanies = async (req, res) => {
let companies;

    try {
        const parameters = ["approved","pending","rejected","all"]
        const specialParameters = ["approved","pending","rejected"]
        const {statusParameter} = req.params
 
        if(!parameters.includes(statusParameter)){
            return res.status(400).json({message: "invalid status parameter"
            })
        }

         if(specialParameters.includes(statusParameter))
         companies = await Mail.find({status: statusParameter});

        if(statusParameter==="all")
        {
            companies = await Mail.find()
        }
       return res.status(200).json({companies,count:companies.length});
    } catch (error) {
        console.error(error);
       return res.status(500).json({ message: "Server error" });
    }
};
const deleteCompanyMail = async (req, res) => {
    try {
        const { id } = req.params;
        await Mail.findByIdAndDelete(id);
        res.status(200).json({ message: "Company email deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const upvoteCompanyMail = async (req, res) => {
    try {
        const { id } = req.params;
        const companyMail = await Mail.findById(id);
        if (!companyMail) {
            return res.status(404).json({ message: "Company email not found" });
        }
        companyMail.upvote += 1;
        await companyMail.save();
        res.status(200).json({ message: "Upvoted successfully", upvote: companyMail.upvote });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const downvoteCompanyMail = async (req, res) => {
    try {
        const { id } = req.params;
        const companyMail = await Mail.findById(id);
        if (!companyMail) {
            return res.status(404).json({ message: "Company email not found" });
        }
        companyMail.downvote += 1;
        await companyMail.save();
        res.status(200).json({ message: "Downvoted successfully", downvote: companyMail.downvote });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

const reportCompanyMail = async (req, res) => {
    try {
        const { id } = req.params;
        const companyMail = await Mail.findById(id);
        const User = await user.findById(req.user._id);

        if(!companyMail) {
            return res.status(404).json({ message: "Company email not found" });
        }
        companyMail.reports += 1;
        await companyMail.save();
        User.reportedArray.push(companyMail._id);
        await User.save();
        res.status(200).json({ message: "Reported successfully", reports: companyMail.reports });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { addCompany, getCompanies, deleteCompanyMail, upvoteCompanyMail, downvoteCompanyMail, reportCompanyMail };    