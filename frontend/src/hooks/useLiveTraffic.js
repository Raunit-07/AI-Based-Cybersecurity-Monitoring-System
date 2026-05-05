import { useState, useEffect, useRef } from "react";
import { getSocket } from "../services/socket";
import { useQueryClient } from "@tanstack/react-query";

export const useLiveTraffic = () => {
  const [trafficData, setTrafficData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      console.error("❌ Socket instance not available");
      return;
    }

    socketRef.current = socket;

    // ================= CONNECTION =================
    const handleConnect = () => {
      setIsConnected(true);
      console.log("✅ Socket connected:", socket.id);
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      console.warn("⚠️ Socket disconnected:", reason);
    };

    // ================= TRAFFIC =================
    const handleTrafficUpdate = (data) => {
      console.log("📊 RECEIVED TRAFFIC:", data);

      if (!data || typeof data.requests !== "number") {
        console.warn("⚠️ Invalid traffic data:", data);
        return;
      }

      const safeRequests = Math.max(0, Number(data.requests));

      setTrafficData((prev) => {
        const updated = [
          ...prev.slice(-19), // keep last 20 points
          {
            time: Date.now(),
            requests: safeRequests,
          },
        ];
        return updated;
      });
    };

    // ================= ALERTS =================
    const handleNewAlert = (alert) => {
      console.log("🚨 RECEIVED ALERT (traffic hook):", alert);

      if (!alert || typeof alert !== "object" || !alert.id) {
        console.warn("⚠️ Invalid alert data:", alert);
        return;
      }

      // ✅ Normalize alert structure (important)
      const formattedAlert = {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        source: alert.ip,
        time: alert.timestamp,
        status: "active",
      };

      queryClient.setQueryData(["alerts"], (oldData) => {
        const safeOld = Array.isArray(oldData) ? oldData : [];
        return [formattedAlert, ...safeOld].slice(0, 50);
      });
    };

    // ================= REGISTER EVENTS =================
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("traffic_update", handleTrafficUpdate);
    // socket.on("new_alert", handleNewAlert);

    // ================= INITIAL STATE =================
    if (socket.connected) {
      setIsConnected(true);
    }

    // ================= CLEANUP =================
    return () => {
      if (!socketRef.current) return;

      socketRef.current.off("connect", handleConnect);
      socketRef.current.off("disconnect", handleDisconnect);
      socketRef.current.off("traffic_update", handleTrafficUpdate);
      socketRef.current.off("new_alert", handleNewAlert);
    };
  }, [queryClient]);

  return {
    trafficData,
    isConnected,
  };
};