const Counter = require("../models/Counter");

const getNext = async (id, storeId, createdBy) => {
  if (!storeId) throw new Error("storeId is required");
  const key = `${id}:${storeId}`;
  const counter = await Counter.findOneAndUpdate(
    { id: key, storeId: storeId },
    {
      $inc: { seq: 1 },
      $setOnInsert: { createdBy: createdBy },
    },
    { new: true, upsert: true }
  );

  return counter.seq;
};

module.exports = { getNext };
