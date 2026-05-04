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

// ================= GET SOCKET (SINGLETON) =================
export const getSocket = () => {
  if (!socket) {
    socket = io(BASE_URL, {
      path: "/socket.io", // must match backend
      transports: ["websocket"], // stable in production
      withCredentials: true,

      // 🔁 Reconnection strategy
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // ================= DEBUG EVENTS =================
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠️ Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", {
        message: err.message,
        url: BASE_URL,
      });
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log(`🔄 Reconnect attempt: ${attempt}`);
    });

    socket.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed completely");
    });
  }

  return socket;
};

// ================= CONNECTION STATE HELPER =================
export const isSocketConnected = () => {
  return socket && socket.connected;
};

// ================= CLEAN DISCONNECT =================
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners(); // prevent memory leaks
    socket.disconnect();
    socket = null;
    console.log("🛑 Socket disconnected cleanly");
  }
};