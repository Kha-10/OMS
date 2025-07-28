const redis = require("../config/redisClient");

const clearOrderCache = async () => {
  const keys = await redis.keys("order:*");
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

module.exports = clearOrderCache;
