const superAdminAuth = (req, res, next) => {
    if (!req.user || req.user.role !== "superAdmin") {
        return res.status(403).json({ message: "Access denied. Super admin only." });
    }
    next();
};

module.exports = superAdminAuth ;