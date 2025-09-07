const redis = require("../config/redisClient");

const clearCartCache = async (key) => {
  const keys = await redis.keys(key);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

module.exports = clearCartCache;
