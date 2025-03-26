function isDealer(req, res, next) {
    if (req.user.role !== "dealer") {
      return res
        .status(401)
        .json({ error: "Unauthorized : user is not Dealer" });
    }
  
    next();
  }
  
  module.exports = isDealer;