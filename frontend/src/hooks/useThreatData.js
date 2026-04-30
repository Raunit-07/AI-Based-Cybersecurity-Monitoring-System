import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

// ================= ALERTS =================
export const useAlerts = () => {
  return useQuery({
    queryKey: ["alerts"],

    queryFn: async () => {
      const res = await api.get("/alerts");

      // ✅ Normalize response safely
      const alerts =
        res?.data?.data?.alerts ||   // preferred backend format
        res?.data?.alerts ||         // fallback
        [];

      return Array.isArray(alerts) ? alerts : [];
    },

    staleTime: 60000,

    // ✅ Prevent UI crash
    retry: 2,

    onError: (error) => {
      console.error("Error fetching alerts:", error.message);
    },
  });
};

// ================= SUSPICIOUS IPS =================
export const useSuspiciousIPs = () => {
  return useQuery({
    queryKey: ["ips"],

    queryFn: async () => {
      const res = await api.get("/ips");

      const ips =
        res?.data?.data?.ips ||
        res?.data?.ips ||
        [];

      return Array.isArray(ips) ? ips : [];
    },

    staleTime: 60000,
    retry: 2,

    onError: (error) => {
      console.error("Error fetching IPs:", error.message);
    },
  });
};