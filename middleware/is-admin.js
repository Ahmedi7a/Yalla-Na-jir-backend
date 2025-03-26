function isAdmin(req, res, next) {
    if (req.user.role !== "admin") {
      return res.status(401).json({ error: "Unauthorized : user is not Admin" });
    }
  
    next();
  }
  
  module.exports = isAdmin;