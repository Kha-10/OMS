const redis = require("../config/redisClient");

// async function clearProductCache() {
//   try {
//     // Find all keys matching the product cache pattern
//     const keys = await redis.keys("products:*");

//     if (keys.length > 0) {
//       console.log('kk',keys);
//       await redis.del(...keys);
//       console.log(`Cleared ${keys.length} product cache keys.`);
//     } else {
//       console.log("No product cache keys found.");
//     }
//   } catch (err) {
//     console.error("Error clearing product cache:", err);
//   }
// }

const clearProductCache = async () => {
  const keys = await redis.keys("products:page*");
  if (keys.length > 0) {
    await redis.del(keys);
  }
};

module.exports = clearProductCache;
