 const User = require("../Model/Users");

const addTemplate = async (req, res) => {
  try {
    const { subject, text } = req.body;

    if (typeof subject !== "string" || typeof text !== "string") {
      return res.status(400).json({ message: "Subject and text are required" });
    }
    if (subject.length > 200 || text.length > 5000) {
      return res.status(400).json({ message: "Subject or text is too long" });
    }

    await User.updateOne(
      { _id: req.user._id },
      { $set: { "template.subject": subject, "template.text": text } }
    );

    return res.status(200).json({ message: "Template added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getTemplate = async (req, res) => {
  try {
    const template = await User.findById(req.user._id).select("template email");
    if (!template) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ template });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { addTemplate, getTemplate };