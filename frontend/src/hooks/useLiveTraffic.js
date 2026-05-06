import {
  useState,
  useEffect,
  useRef,
} from "react";

import { getSocket } from "../services/socket";

import { useQueryClient } from "@tanstack/react-query";

/**
 * =====================================
 * LIVE TRAFFIC HOOK
 * =====================================
 */
export const useLiveTraffic = () => {
  const [trafficData, setTrafficData] =
    useState([]);

  const [isConnected, setIsConnected] =
    useState(false);

  const queryClient =
    useQueryClient();

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();

    if (!socket) {
      console.error(
        "❌ Socket instance not available"
      );

      return;
    }

    socketRef.current = socket;

    // ================= CONNECT =================
    const handleConnect = () => {
      setIsConnected(true);

      console.log(
        "✅ Socket connected:",
        socket.id
      );
    };

    // ================= DISCONNECT =================
    const handleDisconnect = (
      reason
    ) => {
      setIsConnected(false);

      console.warn(
        "⚠️ Socket disconnected:",
        reason
      );
    };

    // ================= TRAFFIC =================
    const handleTrafficUpdate = (
      data
    ) => {
      console.log(
        "📊 RECEIVED TRAFFIC:",
        data
      );

      // 🔒 VALIDATION
      if (
        !data ||
        typeof data !== "object"
      ) {
        console.warn(
          "⚠️ Invalid traffic payload:",
          data
        );

        return;
      }

      const safeRequests =
        Math.max(
          0,
          Number(data.requests) ||
          0
        );

      const safeBlocked =
        Math.max(
          0,
          Number(data.blocked) ||
          0
        );

      const trafficPoint = {
        // Chart timestamp
        time:
          data.timestamp ||
          Date.now(),

        // Main traffic
        requests:
          safeRequests,

        // Blocked traffic
        blocked:
          safeBlocked,

        // Extra metadata
        ip: data.ip || "",

        attackType:
          data.attackType ||
          "Unknown",
      };

      setTrafficData((prev) => {
        const updated = [
          ...prev.slice(-19),
          trafficPoint,
        ];

        return updated;
      });
    };

    // ================= ALERTS =================
    const handleNewAlert = (
      alert
    ) => {
      console.log(
        "🚨 RECEIVED ALERT:",
        alert
      );

      // 🔒 VALIDATION
      if (
        !alert ||
        typeof alert !==
        "object"
      ) {
        console.warn(
          "⚠️ Invalid alert:",
          alert
        );

        return;
      }

      const formattedAlert = {
        id:
          alert.id ||
          crypto.randomUUID(),

        type:
          alert.attackType ||
          alert.type ||
          "Unknown Threat",

        severity:
          alert.severity ||
          "medium",

        source:
          alert.ip ||
          "Unknown",

        time:
          alert.timestamp ||
          new Date(),

        status: "active",
      };

      // ================= UPDATE CACHE =================
      queryClient.setQueryData(
        ["alerts"],
        (oldData) => {
          const safeOld =
            Array.isArray(
              oldData
            )
              ? oldData
              : [];

          return [
            formattedAlert,
            ...safeOld,
          ].slice(0, 50);
        }
      );
    };

    // ================= REGISTER EVENTS =================
    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "traffic_update",
      handleTrafficUpdate
    );

    socket.on(
      "new_alert",
      handleNewAlert
    );

    // ================= INITIAL STATE =================
    if (socket.connected) {
      setIsConnected(true);
    }

    // ================= CLEANUP =================
    return () => {
      if (!socketRef.current)
        return;

      socketRef.current.off(
        "connect",
        handleConnect
      );

      socketRef.current.off(
        "disconnect",
        handleDisconnect
      );

      socketRef.current.off(
        "traffic_update",
        handleTrafficUpdate
      );

      socketRef.current.off(
        "new_alert",
        handleNewAlert
      );
    };
  }, [queryClient]);

  return {
    trafficData,

    isConnected,
  };
};