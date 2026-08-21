const moderatorAuth = (req, res, next) => {
    if (!req.user || req.user.role !== "moderator" && req.user.role !== "superAdmin"    ) {
        return res.status(403).json({ message: "Access denied. Moderator only." });
    }
    next();
};

module.exports =  moderatorAuth ; 