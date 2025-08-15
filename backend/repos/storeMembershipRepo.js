const StoreMember = require("../models/StoreMember.js");

const findByUserId = async (userId) => {
  return StoreMember.find({ userId }).populate("store", "name").lean();
};

// const storeMemberships = await StoreMember.find({ userId })
//   .populate("storeId", "name") // only populate store name
//   .lean();

// const stores = storeMemberships.map((m) => ({
//   _id: m.storeId._id,
//   name: m.storeId.name,
// }));

// res.json({
//   userId,
//   stores,
// });

module.exports = {
  findByUserId,
};
