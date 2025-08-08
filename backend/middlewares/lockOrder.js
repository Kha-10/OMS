const redisClient = require("../config/redisClient");

const lockOrderMiddleware = async (req, res, next) => {
  const { id } = req.params;
  const lockKey = `lock:edit:order:${id}`;
  const lockTTL = 30;

  try {
    //   const acquired = await redisClient.set(lockKey, "locked", {
    //     NX: true,
    //     EX: lockTTL,
    //   });
    const acquired = await redisClient.set(lockKey, "locked", {
      nx: true,
      ex: lockTTL,
    });

    if (!acquired) {
      return res.status(423).json({
        msg: "This order is currently being edited by someone else.",
      });
    }

    // Pass lock info to next middleware/controller if needed
    req.lockKey = lockKey;
    next();
  } catch (error) {
    return res.status(500).json({ msg: "Error acquiring lock" });
  }
};

module.exports = lockOrderMiddleware;
