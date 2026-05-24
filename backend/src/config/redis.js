import Redis from "ioredis";

let connection = null;

export const connectRedis = async () => {
  try {
    if (connection) return connection;

    let redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      if (process.env.NODE_ENV === "development") {
        redisUrl = "redis://localhost:6379";
      } else {
        redisUrl = "redis://redis:6379";
      }
    }

    console.log(`🔍 Using Redis URL: ${redisUrl}`);

    connection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000,

      retryStrategy(times) {
        if (times > 10) {
          console.warn("⚠ Redis unavailable → degraded mode");
          return null;
        }

        return Math.min(times * 500, 3000);
      },
    });

    connection.on("connect", () => {
      console.log("✅ Redis connected");
    });

    connection.on("ready", () => {
      console.log("🚀 Redis ready");
    });

    connection.on("error", (err) => {
      console.error("❌ Redis Error:", err.message);
    });

    await connection.connect();

    return connection;
  } catch (err) {
    console.error("❌ Redis startup failed:", err.message);
    connection = null;
    return null;
  }
};

export const getRedisConnection = () => connection;
