import Redis from "ioredis";

let connection = null;

// ================= CREATE REDIS CONNECTION =================

export const connectRedis = async () => {
  try {
    // Return existing instance if already initialized
    if (connection) {
      return connection;
    }

    // Priority:
    // 1. REDIS_URL (Render / cloud)
    // 2. REDIS_HOST + REDIS_PORT
    // 3. Docker local service name
    const redisUrl =
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || "redis"}:${
        process.env.REDIS_PORT || 6379
      }`;

    console.log(`🔍 Connecting Redis → ${redisUrl}`);

    connection = new Redis(redisUrl, {
      password: process.env.REDIS_PASSWORD || undefined,

      // Prevent request queue hanging forever
      maxRetriesPerRequest: 3,

      // Wait for Redis readiness
      enableReadyCheck: true,

      // Connect only when called
      lazyConnect: true,

      // Keep TCP connection alive
      keepAlive: 30000,

      connectTimeout: 10000,

      retryStrategy(times) {
        const delay = Math.min(times * 500, 5000);

        console.log(`⚠ Redis reconnect attempt ${times} (delay: ${delay}ms)`);

        return delay;
      },
    });

    // Explicit connect
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

    connection.on("reconnecting", () => {
      console.log("🔄 Redis reconnecting...");
    });

    return connection;
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);

    // Do NOT kill backend in production
    // Allow degraded mode
    return null;
  }
};

// ================= GET CONNECTION =================

export const getRedisConnection = () => {
  if (!connection) {
    console.warn("⚠ Redis unavailable - running in degraded mode");

    return null;
  }

  return connection;
};
