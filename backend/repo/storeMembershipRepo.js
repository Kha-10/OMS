const StoreMember = require("../models/StoreMember.js");

const findByUserId = async (userId) => {
  return StoreMember.find({ user: userId }).populate("store").lean();
};

module.exports = {
  findByUserId,
};
