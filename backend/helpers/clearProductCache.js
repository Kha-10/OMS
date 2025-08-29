const redis = require("../config/redisClient");

// const clearProductCache = async () => {
//   const keys = await redis.keys("products:page*");
//   if (keys.length > 0) {
//     await redis.del(...keys);
//   }
// };

const clearProductCache = async (storeId, mainKey = "products") => {
  console.log("clearProductCache");
  const pattern = `${mainKey}:store${storeId}:*`;
  let cursor = "0";
  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100
    );
    cursor = nextCursor;
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } while (cursor !== "0");
};

module.exports = clearProductCache;
