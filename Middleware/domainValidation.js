 const validDomain = require("../Model/ValidDomains");
const dns = require("dns").promises;

const checkDomain = async (req, res, next) => {
  try {
    const { companyName, email } = req.body;

    if (typeof email !== "string" || typeof companyName !== "string") {
      return res.status(400).json({ message: "Company name and email are required" });
    }

    const parts = email.split("@");
    if (parts.length !== 2 || !parts[1]) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    const domain = parts[1].toLowerCase();

    const exists = await validDomain.findOne({ domain });
    if (exists) {
      return next();
    }

    let mxRecords = [];
    try {
      mxRecords = await dns.resolveMx(domain);
    } catch {
      return res.status(400).json({ message: "Domain does not have a mail server" });
    }

    if (!mxRecords.length) {
      return res.status(400).json({ message: "Domain does not have a mail server" });
    }

    await validDomain.updateOne(
      { domain },
      { $setOnInsert: { domain, companyName: companyName.trim() } },
      { upsert: true }
    );

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = checkDomain;