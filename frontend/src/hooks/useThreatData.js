import { useQuery } from "@tanstack/react-query";
import api from "../services/api";
import { useAuth } from "./useAuth";

// ================= ALERTS =================
export const useAlerts = () => {
  const { user } = useAuth();

  return useQuery({
    // ✅ Multi-user safe cache
    queryKey: ["alerts", user?.id],

    // ✅ Only fetch if user exists
    enabled: !!user?.id,

    queryFn: async () => {
      const res = await api.get("/alerts");

      // Backend normalized response
      const alerts =
        res?.data?.alerts ||
        res?.data ||
        [];

      return Array.isArray(alerts) ? alerts : [];
    },

    staleTime: 60000,

    // ✅ Prevent UI crashes
    retry: 2,

    refetchOnWindowFocus: false,

    onError: (error) => {
      console.error("Error fetching alerts:", error.message);
    },
  });
};

// ================= SUSPICIOUS IPS =================
export const useSuspiciousIPs = () => {
  const { user } = useAuth();

  return useQuery({
    // ✅ Multi-user safe cache
    queryKey: ["ips", user?.id],

    // ✅ Prevent unauthorized fetches
    enabled: !!user?.id,

    queryFn: async () => {
      const res = await api.get("/ips");

      const ips =
        res?.data?.ips ||
        res?.data ||
        [];

      return Array.isArray(ips) ? ips : [];
    },

    staleTime: 60000,

    retry: 2,

    refetchOnWindowFocus: false,

    onError: (error) => {
      console.error("Error fetching IPs:", error.message);
    },
  });
};