const { createClient } = require('redis')

const redisClient = createClient({
  url: "redis://localhost:6379", // Change this if using a remote Redis server
});

redisClient.on("error", (err) => console.error("Redis Error:", err));

(async () => {
  await redisClient.connect();
  console.log("Connected to Redis!");
})();

module.exports = redisClient;