const redis = require('../config/redisClient');

async function clearProductCache() {
    console.log('i do');
  try {
    // Find all keys matching the product cache pattern
    const keys = await redis.keys('products:*');

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cleared ${keys.length} product cache keys.`);
    } else {
      console.log('No product cache keys found.');
    }
  } catch (err) {
    console.error('Error clearing product cache:', err);
  }
}

module.exports = clearProductCache;