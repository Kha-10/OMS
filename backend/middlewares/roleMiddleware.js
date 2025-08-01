const roleMiddleware = (roles) => {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Forbidden: You do not have the right permissions' });
      }
  
      next();
    };
  };

module.exports = roleMiddleware;