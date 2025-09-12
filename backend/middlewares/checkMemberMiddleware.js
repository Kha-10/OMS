const StoreMember = require("../models/StoreMember");

const checkMemberMiddleware = async (req, res, next) => {
  const userId = req.user.id;
  const storeId = req.params.storeId;

  const member = await StoreMember.findOne({ store: storeId, user: userId });
  if (!member) return res.status(403).json({ message: "Not a store member" });

  req.storeId = storeId;
  req.userId = userId;
  req.memberRole = member.role;

  next();
};

module.exports = checkMemberMiddleware;
