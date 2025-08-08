const Order = require("../models/Order");
const redisClient = require("../config/redisClient");

const idempotencyCheck = async (req, res, next) => {
  const idempotencyKey = req.headers["idempotency-key"];
  console.log("idempotencyKey", idempotencyKey);
  if (!idempotencyKey) {
    return res.status(400).json({ error: "Idempotency key required" });
  }

  try {
    const redisData = await redisClient.get(`idemp:${idempotencyKey}`);
    console.log("redisData", redisData);
    if (redisData) {
      const parsed = JSON.parse(redisData);
      if (parsed.status === "completed") {
        const order = await Order.findById(_id);
        return res.status(200).json(order);
      }

      if (parsed.status === "failed") {
        return res
          .status(409)
          .json({ msg: parsed.error || "Previous request failed" });
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
      `idemp:${idempotencyKey}`,
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
