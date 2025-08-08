// const { createClient } = require('redis')

// const redisClient = createClient({
//   url: "redis://localhost:6379", // Change this if using a remote Redis server
// });

// redisClient.on("error", (err) => console.error("Redis Error:", err));

// (async () => {
//   await redisClient.connect();
//   console.log("Connected to Redis!");
// })();

// redisClient.js
const { Redis } = require("@upstash/redis");

const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

module.exports = redisClient;