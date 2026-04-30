import { createClient } from "redis";

let redisClient;

// ================= CONNECT =================
export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://redis:6379",
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
    });

    await redisClient.connect();

    console.log("✅ Redis connected");
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);
  }
};

// ================= GET CLIENT =================
export const getRedisClient = () => {
  return redisClient;
};