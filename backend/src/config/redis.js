import Redis from "ioredis";

let connection = null;

export const connectRedis = async () => {
  try {
    if (connection) return connection;

    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn("⚠ REDIS_URL missing - Redis disabled");
      return null;
    }

    console.log(`🔍 Using Redis URL: ${redisUrl}`);

    connection = new Redis(redisUrl, {
      // REQUIRED for BullMQ
      maxRetriesPerRequest: null,

      enableReadyCheck: true,

      lazyConnect: true,

      connectTimeout: 10000,

      retryStrategy(times) {
        const delay = Math.min(times * 500, 5000);

        console.log(`Redis reconnect attempt ${times}`);

        return delay;
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

    connection.on("close", () => {
      console.log("⚠ Redis connection closed");
    });

    await connection.connect();

    return connection;
  } catch (err) {
    console.error("❌ Redis connection failed:", err.message);

    return null;
  }
};

export const getRedisConnection = () => {
  return connection;
};
