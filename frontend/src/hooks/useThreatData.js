import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

// ================= ALERTS =================
export const useAlerts = () => {
  return useQuery({
    queryKey: ["alerts"],

    queryFn: async () => {
      const res = await api.get("/alerts");

      // After interceptor unwrap: res = {success, data: {alerts, total}, message}
      const alerts =
        res?.data?.alerts ||   // preferred backend format
        res?.data ||           // fallback
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

      // After interceptor unwrap: res = {success, data: {ips}, message}
      const ips =
        res?.data?.ips ||
        res?.data ||
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