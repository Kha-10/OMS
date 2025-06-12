const redis = require("../config/redisClient");

const clearProductCache = async () => {
  const keys = await redis.keys("products:page*");
  if (keys.length > 0) {
    await redis.del(keys);
  }
};

module.exports = clearProductCache;
