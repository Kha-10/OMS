const Order = require("../models/Order");
const redisClient = require("../config/redisClient");

const idempotencyCheck = async (req, res, next) => {
  const idempotencyKey = req.headers["idempotency-key"];
  const storeId = req.storeId;
  if (!idempotencyKey) {
    return res.status(400).json({ error: "Idempotency key required" });
  }

  try {
    const redisData = await redisClient.get(
      `storeId${storeId}idemp:${idempotencyKey}`
    );

    if (redisData) {
      // const parsed = JSON.parse(redisData);
      if (redisData.status === "completed") {
        const order = await Order.findById(_id);
        return res.status(200).json(order);
      }

      if (redisData.status === "failed") {
        return res
          .status(409)
          .json({ msg: redisData.error || "Previous request failed" });
      }

      return res.status(409).json({
        error:
          "Duplicate order request detected. This order has already been processed.",
      });
    }

    // Reserve key for processing
    // await redisClient.setEx(
    //   `idemp:${idempotencyKey}`,
    //   300, // 5-minute lock
    //   JSON.stringify({ status: "processing" })
    // );
    await redisClient.set(
      `storeId${storeId}idemp:${idempotencyKey}`,
      JSON.stringify({ status: "processing" }),
      { ex: 300 }
    );

    req.idempotencyKey = idempotencyKey;
    next();
  } catch (err) {
    res.status(503).json({ error: "Service unavailable" });
  }
};

module.exports = idempotencyCheck;
