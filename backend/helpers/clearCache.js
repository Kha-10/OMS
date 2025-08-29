const redis = require("../config/redisClient");

const clearCache = async (storeId, mainKey) => {
  const keys = await redis.keys(`${mainKey}:store${storeId}:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

module.exports = clearCache;
