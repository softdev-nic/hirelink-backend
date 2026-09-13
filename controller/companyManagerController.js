 const Mail = require("../Model/LinkSchema");
const User = require("../Model/Users");

const addCompany = async (req, res) => {
  try {
    const { companyName, email, category } = req.body;

    if (typeof companyName !== "string" || typeof email !== "string" || !companyName.trim() || !email.trim()) {
      return res.status(400).json({ message: "Company name and email are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingCompany = await Mail.findOne({
      $or: [{ email: normalizedEmail }, { companyName: companyName.trim() }],
    });
    if (existingCompany) {
      return res.status(400).json({ message: "Company already exists" });
    }

    const newCompany = new Mail({
      companyName: companyName.trim(),
      email: normalizedEmail,
      category: typeof category === "string" ? category : undefined,
      postedBy: req.user._id,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    await newCompany.save();
    return res.status(201).json({ message: "Company added successfully", id: newCompany._id });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid category or missing field" });
    }
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getCompanies = async (req, res) => {
  try {
    const parameters = ["approved", "pending", "rejected", "all"];
    const { statusParameter } = req.params;

    if (!parameters.includes(statusParameter)) {
      return res.status(400).json({ message: "Invalid status parameter" });
    }

    const isModerator = req.user.role === "moderator" || req.user.role === "superAdmin";
    const forbidden = ["all", "pending", "rejected"];

    if (!isModerator && forbidden.includes(statusParameter)) {
      return res.status(403).json({ message: "Access denied for this filter" });
    }

    const filter = statusParameter === "all" ? {} : { status: statusParameter };
    const companies = await Mail.find(filter);

    return res.status(200).json({ companies, count: companies.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteCompanyMail = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Mail.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Company email not found" });
    }
    return res.status(200).json({ message: "Company email deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const castVote = async (req, res, { arrayField, oppositeField, counter, oppositeCounter, label }) => {
  try {
    const { id } = req.params;

    const companyMail = await Mail.findById(id);
    if (!companyMail) {
      return res.status(404).json({ message: "Company email not found" });
    }

    const hadOpposite = req.user[oppositeField]?.some((m) => m.equals(companyMail._id));

    const added = await User.updateOne(
      { _id: req.user._id, [arrayField]: { $ne: companyMail._id } },
      { $addToSet: { [arrayField]: companyMail._id }, $pull: { [oppositeField]: companyMail._id } }
    );

    if (added.modifiedCount === 0) {
      return res.status(400).json({ message: `You have already ${label} this mail` });
    }

    const update = { $inc: { [counter]: 1 } };
    if (hadOpposite) {
      update.$inc[oppositeCounter] = -1;
    }

    const updated = await Mail.findByIdAndUpdate(id, update, { new: true });

    return res.status(200).json({
      message: `${label.charAt(0).toUpperCase() + label.slice(1)} successfully`,
      upvote: updated.upvote,
      downvote: updated.downvote,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const upvoteCompanyMail = (req, res) =>
  castVote(req, res, {
    arrayField: "upvoteArray",
    oppositeField: "downvoteArray",
    counter: "upvote",
    oppositeCounter: "downvote",
    label: "upvoted",
  });

const downvoteCompanyMail = (req, res) =>
  castVote(req, res, {
    arrayField: "downvoteArray",
    oppositeField: "upvoteArray",
    counter: "downvote",
    oppositeCounter: "upvote",
    label: "downvoted",
  });

const reportCompanyMail = async (req, res) => {
  try {
    const { id } = req.params;

    const companyMail = await Mail.findById(id);
    if (!companyMail) {
      return res.status(404).json({ message: "Company email not found" });
    }

    const added = await User.updateOne(
      { _id: req.user._id, reportedArray: { $ne: companyMail._id } },
      { $addToSet: { reportedArray: companyMail._id } }
    );

    if (added.modifiedCount === 0) {
      return res.status(400).json({ message: "You have already reported this mail" });
    }

    const updated = await Mail.findByIdAndUpdate(id, { $inc: { reports: 1 } }, { new: true });

    return res.status(200).json({ message: "Reported successfully", reports: updated.reports });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  addCompany,
  getCompanies,
  deleteCompanyMail,
  upvoteCompanyMail,
  downvoteCompanyMail,
  reportCompanyMail,
};