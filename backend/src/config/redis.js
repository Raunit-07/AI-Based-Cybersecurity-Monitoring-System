import Redis from "ioredis";

let connection = null;

// ================= CREATE REDIS CONNECTION =================

export const connectRedis = async () => {
  try {
    if (connection) {
      return connection;
    }

    // Prefer REDIS_URL if provided
    const redisUrl =
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || "redis"}:${process.env.REDIS_PORT || 6379}`;

    connection = new Redis(redisUrl, {
      password: process.env.REDIS_PASSWORD || undefined,

      maxRetriesPerRequest: null,

      enableReadyCheck: true,

      lazyConnect: true,

      retryStrategy(times) {
        const delay = Math.min(times * 500, 5000);

        console.log(`Redis reconnect attempt ${times}`);

        return delay;
      },
    });

    // Explicit connection attempt
    await connection.connect();

    connection.on("connect", () => {
      console.log("✅ Redis connected");
    });

    connection.on("ready", () => {
      console.log("🚀 Redis ready");
    });

    connection.on("error", (err) => {
      console.error("❌ Redis Error:", err.message);
    });

    connection.on("close", () => {
      console.log("⚠ Redis connection closed");
    });

    return connection;
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);

    return null;
  }
};

// ================= GET CONNECTION =================

export const getRedisConnection = () => {
  if (!connection) {
    throw new Error("Redis not initialized");
  }

  return connection;
};
