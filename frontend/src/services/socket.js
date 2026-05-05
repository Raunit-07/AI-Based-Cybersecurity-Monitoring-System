import { io } from "socket.io-client";

// ================= BASE URL =================
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    try {
      const url = new URL(envUrl);
      return `${url.protocol}//${url.host}`;
    } catch (err) {
      console.warn("⚠️ Invalid VITE_API_URL, falling back to localhost");
    }
  }

  return "http://localhost:5000";
};

const BASE_URL = getBaseURL();

// ================= SOCKET INSTANCE =================
let socket = null;

// ================= CREATE SOCKET =================
const createSocket = () => {
  return io(BASE_URL, {
    path: "/socket.io",
    transports: ["websocket"], // force websocket for performance
    withCredentials: true,

    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  });
};

// ================= GET SOCKET =================
export const getSocket = () => {
  if (!socket) {
    socket = createSocket();

    // ===== Core Events =====
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });
  }

  return socket;
};

// ================= ALERT SUBSCRIPTION =================
export const subscribeToAlerts = (handler) => {
  const socket = getSocket();

  if (typeof handler !== "function") {
    console.error("❌ subscribeToAlerts requires a valid function");
    return () => { };
  }

  // ✅ Clean previous listeners (prevents duplicate events)
  socket.off("new_alert");

  const safeHandler = (alert) => {
    try {
      // 🔒 Strict validation (production safety)
      if (
        !alert ||
        typeof alert !== "object" ||
        !alert.ip ||
        !alert.attackType
      ) {
        return;
      }

      const formattedAlert = {
        id: alert._id || alert.id,
        ip: alert.ip,
        attackType: alert.attackType,
        anomalyScore: alert.anomalyScore ?? 0,
        timestamp: alert.timestamp || new Date().toISOString(),
      };

      handler(formattedAlert);
    } catch (err) {
      console.error("❌ Error handling alert:", err);
    }
  };

  // ✅ MAIN EVENT LISTENER (ONLY ONE)
  socket.on("new_alert", safeHandler);

  // ✅ CLEANUP FUNCTION (VERY IMPORTANT)
  return () => {
    socket.off("new_alert", safeHandler);
  };
};

// ================= CONNECTION STATE =================
export const isSocketConnected = () => {
  return socket?.connected ?? false;
};

// ================= CLEAN DISCONNECT =================
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log("🛑 Socket disconnected cleanly");
  }
};