const Store = require("../models/Store");

const findByStoreId = async (id) => {
  return Store.findById(id);
};

const update = async (id, storeData) => {
  return Store.findByIdAndUpdate(id, { $set: storeData }, { new: true });
};

module.exports = {
  findByStoreId,
  update,
};
