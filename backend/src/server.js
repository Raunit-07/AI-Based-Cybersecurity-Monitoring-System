import dotenv from "dotenv";
dotenv.config();

import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import http from "http";
import jwt from "jsonwebtoken";
import cookie from "cookie";

import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";

import { Server } from "socket.io";

import { verifyEmailService } from "./integrations/email.js";
import { startLogWatcher } from "./services/logWatcher.service.js";

const PORT = process.env.PORT || 5000;

const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

/**
 * ================= SERVER SETUP =================
 */
const server = http.createServer(app);

/**
 * ================= SOCKET.IO CONFIG =================
 */
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,

    methods: ["GET", "POST"],

    credentials: true,
  },

  transports: [
    "websocket",
    "polling",
  ],

  pingTimeout: 60000,

  pingInterval: 25000,
});

/**
 * ================= SOCKET AUTH =================
 * Production-safe cookie auth
 */
io.use(async (socket, next) => {
  try {
    /**
     * ================= READ COOKIES =================
     */
    const rawCookies =
      socket.handshake.headers
        ?.cookie;

    if (!rawCookies) {
      return next(
        new Error(
          "Unauthorized"
        )
      );
    }

    /**
     * ================= PARSE COOKIES =================
     */
    const parsedCookies =
      cookie.parse(rawCookies);

    const token =
      parsedCookies
        ?.accessToken;

    if (!token) {
      return next(
        new Error(
          "Unauthorized"
        )
      );
    }

    /**
     * ================= VERIFY JWT =================
     */
    if (
      !process.env
        .JWT_ACCESS_SECRET
    ) {
      return next(
        new Error(
          "JWT secret missing"
        )
      );
    }

    const decoded =
      jwt.verify(
        token,
        process.env
          .JWT_ACCESS_SECRET
      );

    if (!decoded?.id) {
      return next(
        new Error(
          "Invalid token payload"
        )
      );
    }

    /**
     * ================= ATTACH USER =================
     */
    socket.userId =
      decoded.id;

    socket.userRole =
      decoded.role;

    next();
  } catch (err) {
    logger.error(
      `Socket auth error: ${err.message}`
    );

    return next(
      new Error(
        "Socket authentication failed"
      )
    );
  }
});

/**
 * ================= SOCKET EVENTS =================
 */
io.on("connection", (socket) => {
  logger.info(
    `Socket connected: ${socket.id} | User: ${socket.userId}`
  );

  /**
   * ================= USER ROOM =================
   */
  socket.join(
    socket.userId
  );

  logger.info(
    `User ${socket.userId} joined private room`
  );

  /**
   * ================= HEALTH CHECK =================
   */
  socket.on("ping", () => {
    socket.emit("pong");
  });

  /**
   * ================= DISCONNECT =================
   */
  socket.on(
    "disconnect",
    (reason) => {
      logger.info(
        `Socket disconnected: ${socket.id} | Reason: ${reason}`
      );
    }
  );

  /**
   * ================= SOCKET ERROR =================
   */
  socket.on(
    "error",
    (err) => {
      logger.error(
        `Socket error (${socket.id}): ${err.message}`
      );
    }
  );
});

/**
 * ================= ATTACH IO =================
 */
app.set("io", io);

/**
 * ================= SERVER INSTANCE =================
 */
let serverInstance =
  null;

/**
 * ================= START SERVER =================
 */
const startServer =
  async () => {
    try {
      /**
       * ================= DATABASE =================
       */
      await connectDB();

      logger.info(
        "Database connected"
      );

      /**
       * ================= EMAIL =================
       */
      try {
        await verifyEmailService();

        logger.info(
          "Email service verified"
        );
      } catch (
      emailError
      ) {
        logger.warn(
          `Email verification failed: ${emailError.message}`
        );
      }

      /**
       * ================= START SERVER =================
       */
      serverInstance =
        server.listen(
          PORT,
          () => {
            logger.info(
              `Server running on port ${PORT}`
            );

            logger.info(
              `Frontend allowed: ${FRONTEND_URL}`
            );

            logger.info(
              "Socket.IO ready"
            );

            /**
             * ================= LOG WATCHER =================
             */
            startLogWatcher(
              io
            );

            logger.info(
              "Real log watcher started"
            );
          }
        );

      /**
       * ================= SERVER ERRORS =================
       */
      serverInstance.on(
        "error",
        (err) => {
          if (
            err.code ===
            "EADDRINUSE"
          ) {
            logger.error(
              `Port ${PORT} already in use`
            );
          } else {
            logger.error(
              `Server error: ${err.message}`
            );
          }

          process.exit(1);
        }
      );
    } catch (error) {
      logger.error(
        `Failed to start server: ${error.message}`
      );

      process.exit(1);
    }
  };

startServer();

/**
 * ================= GRACEFUL SHUTDOWN =================
 */
const shutdown = () => {
  logger.info(
    "Graceful shutdown initiated"
  );

  if (serverInstance) {
    serverInstance.close(
      () => {
        logger.info(
          "Server closed"
        );

        process.exit(0);
      }
    );
  } else {
    process.exit(0);
  }
};

process.on(
  "SIGINT",
  shutdown
);

process.on(
  "SIGTERM",
  shutdown
);

/**
 * ================= GLOBAL ERROR HANDLING =================
 */
process.on(
  "unhandledRejection",
  (err) => {
    logger.error(
      `Unhandled Rejection: ${err.message}`
    );

    shutdown();
  }
);

process.on(
  "uncaughtException",
  (err) => {
    logger.error(
      `Uncaught Exception: ${err.message}`
    );

    shutdown();
  }
);

export {
  serverInstance as server,
  io,
};