import { useQuery } from "@tanstack/react-query";

import api from "../services/api";

/**
 * =====================================
 * FETCH ALERTS
 * =====================================
 */
export const useAlerts = (
  params = {}
) => {
  return useQuery({
    /**
     * Tenant-aware cache isolation
     */
    queryKey: [
      "alerts",
      params,
    ],

    /**
     * ================= FETCH ALERTS =================
     */
    queryFn: async () => {
      const res =
        await api.get(
          "/alerts",
          {
            params,
          }
        );

      /**
       * Expected API format:
       * {
       *   success,
       *   data: {
       *     alerts: [],
       *     pagination
       *   }
       * }
       */

      if (
        Array.isArray(
          res?.data?.alerts
        )
      ) {
        return res.data.alerts;
      }

      if (
        Array.isArray(res?.data)
      ) {
        return res.data;
      }

      return [];
    },

    /**
     * ================= CACHE SETTINGS =================
     */
    staleTime: 60 * 1000,

    retry: 2,

    refetchOnWindowFocus:
      false,
  });
};

/**
 * =====================================
 * FETCH SUSPICIOUS IPS
 * =====================================
 */
export const useSuspiciousIPs =
  (limit = 20) => {
    return useQuery({
      /**
       * Tenant-aware cache isolation
       */
      queryKey: [
        "suspicious-ips",
        limit,
      ],

      /**
       * ================= FETCH IPS =================
       */
      queryFn: async () => {
        const res =
          await api.get(
            "/alerts/suspicious-ips",
            {
              params: {
                limit,
              },
            }
          );

        /**
         * Expected:
         * {
         *   success,
         *   data: {
         *     ips: []
         *   }
         * }
         */

        if (
          Array.isArray(
            res?.data?.ips
          )
        ) {
          return res.data.ips;
        }

        return [];
      },

      staleTime: 60 * 1000,

      retry: 2,

      refetchOnWindowFocus:
        false,
    });
  };