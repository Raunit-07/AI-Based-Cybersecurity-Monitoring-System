import Redis from "ioredis";

let connection = null;

// ================= CREATE REDIS CONNECTION =================

export const connectRedis = async () => {
  try {

    if (connection) {
      return connection;
    }

    connection = new Redis({
      host: process.env.REDIS_HOST || "localhost",

      port: parseInt(
        process.env.REDIS_PORT || "6379"
      ),

      password:
        process.env.REDIS_PASSWORD || undefined,

      maxRetriesPerRequest: null,

      enableReadyCheck: false,

      retryStrategy(times) {

        const delay =
          Math.min(times * 500, 5000);

        console.log(
          `Redis reconnect attempt ${times}`
        );

        return delay;
      }
    });

    connection.on(
      "connect",
      () => {

        console.log(
          "✅ Redis connected"
        );

      }
    );

    connection.on(
      "error",
      (err) => {

        console.error(
          "❌ Redis Error:",
          err.message
        );

      }
    );

    connection.on(
      "close",
      () => {

        console.log(
          "⚠ Redis connection closed"
        );

      }
    );

    return connection;

  } catch (error) {

    console.error(
      "❌ Redis connection failed:",
      error.message
    );

    process.exit(1);

  }
};

// ================= GET CONNECTION =================

export const getRedisConnection = () => {

  if (!connection) {

    throw new Error(
      "Redis not initialized"
    );

  }

  return connection;
};