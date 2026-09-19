const Redis = require("ioredis");

let redisClient;

const getRedisSettings = () => {
  const isUsingTLS = process.env.REDIS_TLS === "true";

  return {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(process.env.REDIS_USERNAME && {
      username: process.env.REDIS_USERNAME,
    }),
    ...(isUsingTLS && { tls: {} }),
  };
};

const setupRedisConnection = () => {
  if (!redisClient) {
    redisClient = new Redis(getRedisSettings());

    redisClient.on("connect", () => {
      console.log("✅ Connected to Redis successfully");
    });

    redisClient.on("ready", () => {
      console.log("✅ Redis is ready to use");
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis connection error:", err);
    });

    redisClient.on("end", () => {
      console.log("🚨 Redis connection closed");
    });
  }
  return redisClient;
};

setupRedisConnection();

module.exports = redisClient;
