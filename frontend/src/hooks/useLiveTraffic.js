import {
  useState,
  useEffect,
  useRef,
} from "react";

import { getSocket } from "../services/socket";

import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./useAuth";

/**
 * =====================================
 * LIVE TRAFFIC HOOK
 * =====================================
 * Handles:
 * - realtime traffic updates
 * - realtime alerts
 * - socket lifecycle
 * - cache synchronization
 */
export const useLiveTraffic = () => {
  const [trafficData, setTrafficData] =
    useState([]);

  const [isConnected, setIsConnected] =
    useState(false);

  const queryClient =
    useQueryClient();

  const socketRef = useRef(null);

  const { user } = useAuth();

  useEffect(() => {
    /**
     * =====================================
     * AUTH GUARD
     * =====================================
     */
    if (!user?.id) return;

    const socket = getSocket();

    if (!socket) {
      console.error(
        "❌ Socket instance unavailable"
      );

      return;
    }

    socketRef.current = socket;

    /**
     * =====================================
     * SOCKET CONNECT
     * =====================================
     */
    const handleConnect = () => {
      setIsConnected(true);

      console.log(
        "✅ Socket connected:",
        socket.id
      );
    };

    /**
     * =====================================
     * SOCKET DISCONNECT
     * =====================================
     */
    const handleDisconnect = (
      reason
    ) => {
      setIsConnected(false);

      console.warn(
        "⚠️ Socket disconnected:",
        reason
      );
    };

    /**
     * =====================================
     * TRAFFIC UPDATE
     * =====================================
     */
    const handleTrafficUpdate = (
      data
    ) => {
      try {
        if (
          !data ||
          typeof data !== "object"
        ) {
          return;
        }

        // =====================================
        // MULTI-TENANT SAFETY
        // =====================================
        if (
          data.user &&
          data.user !== user.id
        ) {
          return;
        }

        const trafficPoint = {
          time:
            data.time ||
            new Date().toISOString(),

          requests: Math.max(
            0,
            Number(data.requests) || 0
          ),

          blocked: Math.max(
            0,
            Number(data.blocked) || 0
          ),

          ip:
            data.ip || "unknown",

          attackType:
            data.attackType ||
            "Normal",
        };

        // =====================================
        // LOCAL STATE
        // =====================================
        setTrafficData((prev) => {
          return [
            ...prev.slice(-19),
            trafficPoint,
          ];
        });

        // =====================================
        // CACHE UPDATE
        // =====================================
        queryClient.setQueryData(
          ["traffic", user.id],
          (oldData = []) => {
            return [
              ...oldData.slice(-19),
              trafficPoint,
            ];
          }
        );
      } catch (error) {
        console.error(
          "❌ Traffic handler error:",
          error.message
        );
      }
    };

    /**
     * =====================================
     * NEW ALERT
     * =====================================
     */
    const handleNewAlert = (
      alert
    ) => {
      try {
        if (
          !alert ||
          typeof alert !==
          "object"
        ) {
          return;
        }

        // =====================================
        // MULTI-TENANT SAFETY
        // =====================================
        if (
          alert.user &&
          alert.user !== user.id
        ) {
          return;
        }

        const formattedAlert = {
          id:
            alert.id ||
            crypto.randomUUID(),

          type:
            alert.attackType ||
            "Unknown Threat",

          severity:
            alert.severity ||
            "medium",

          source:
            alert.ip ||
            "Unknown",

          time:
            alert.timestamp ||
            new Date().toISOString(),

          status:
            alert.status ||
            "active",

          anomalyScore:
            alert.anomalyScore || 0,

          meta:
            alert.meta || {},
        };

        // =====================================
        // DEDUPLICATION
        // =====================================
        queryClient.setQueryData(
          ["alerts", user.id],
          (oldData = []) => {
            const exists =
              oldData.some(
                (a) =>
                  a.id ===
                  formattedAlert.id
              );

            if (exists)
              return oldData;

            return [
              formattedAlert,
              ...oldData,
            ].slice(0, 50);
          }
        );
      } catch (error) {
        console.error(
          "❌ Alert handler error:",
          error.message
        );
      }
    };

    /**
     * =====================================
     * REGISTER EVENTS
     * =====================================
     */
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

    /**
     * =====================================
     * INITIAL SOCKET STATE
     * =====================================
     */
    if (socket.connected) {
      setIsConnected(true);
    }

    /**
     * =====================================
     * CLEANUP
     * =====================================
     */
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
  }, [queryClient, user?.id]);

  return {
    trafficData,

    isConnected,
  };
};