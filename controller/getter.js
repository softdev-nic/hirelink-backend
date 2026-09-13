 const getRole = async (req, res) => {
  try {
    return res.status(200).json({ role: req.user.role });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getRole };