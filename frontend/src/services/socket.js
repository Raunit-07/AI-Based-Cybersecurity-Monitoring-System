import { io } from "socket.io-client";

// ================= BASE URL =================
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;

  if (envUrl) {
    try {
      const url = new URL(envUrl);

      return `${url.protocol}//${url.host}`;
    } catch (err) {
      console.warn(
        "⚠️ Invalid VITE_API_URL, falling back to localhost"
      );
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

    // VERY IMPORTANT
    withCredentials: true,

    transports: ["websocket", "polling"],

    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    timeout: 10000,

    autoConnect: true,
    forceNew: false,
  });
};

// ================= GET SOCKET =================
export const getSocket = () => {
  if (!socket) {
    socket = createSocket();

    // ================= CONNECTION EVENTS =================
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Socket reconnect attempt: ${attempt}`);
    });

    socket.on("reconnect", () => {
      console.log("✅ Socket reconnected");
    });
  }

  return socket;
};

// ================= ALERT SUBSCRIPTION =================
export const subscribeToAlerts = (handler) => {
  const socket = getSocket();

  if (typeof handler !== "function") {
    console.error(
      "❌ subscribeToAlerts requires a valid function"
    );

    return () => { };
  }

  // ================= CLEAN OLD LISTENERS =================
  socket.off("new_alert");

  // ================= SAFE EVENT HANDLER =================
  const safeHandler = (alert) => {
    try {
      if (!alert || typeof alert !== "object") {
        return;
      }

      // ================= NORMALIZE ALERT =================
      const formattedAlert = {
        id: alert._id || alert.id,

        ip: alert.ip || "Unknown",

        attackType:
          alert.attackType ||
          alert.attack_type ||
          "Suspicious",

        severity: alert.severity || "medium",

        anomalyScore:
          typeof alert.anomalyScore === "number"
            ? alert.anomalyScore
            : 0,

        timestamp:
          alert.timestamp ||
          alert.createdAt ||
          new Date().toISOString(),

        message:
          alert.message || "Threat activity detected",
      };

      handler(formattedAlert);
    } catch (err) {
      console.error(
        "❌ Error handling socket alert:",
        err
      );
    }
  };

  // ================= MAIN ALERT EVENT =================
  socket.on("new_alert", safeHandler);

  // ================= OPTIONAL EVENTS =================
  socket.on("alert_created", safeHandler);

  socket.on("threat_detected", safeHandler);

  // ================= CLEANUP =================
  return () => {
    socket.off("new_alert", safeHandler);
    socket.off("alert_created", safeHandler);
    socket.off("threat_detected", safeHandler);
  };
};

// ================= CONNECTION STATE =================
export const isSocketConnected = () => {
  return socket?.connected ?? false;
};

// ================= MANUAL CONNECT =================
export const connectSocket = () => {
  const socket = getSocket();

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
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

export default getSocket;