const Counter = require("../models/Counter");

const getNext = async (id, storeId, createdBy) => {
  console.log("getNext", storeId);
  if (!storeId) throw new Error("storeId is required");
  const counter = await Counter.findOneAndUpdate(
    { id, storeId: storeId },
    {
      $inc: { seq: 1 },
      $setOnInsert: { createdBy: createdBy },
    },
    { new: true, upsert: true }
  );

  return counter.seq;
};

module.exports = { getNext };
