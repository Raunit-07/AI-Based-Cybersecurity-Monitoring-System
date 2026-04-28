import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export const useAlerts = () => {
  return useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const { data } = await api.get('/alerts');
      return data;
    },
    staleTime: 60000, // 1 minute
  });
};

export const useSuspiciousIPs = () => {
  return useQuery({
    queryKey: ['ips'],
    queryFn: async () => {
      const { data } = await api.get('/ips');
      return data;
    },
    staleTime: 60000,
  });
};
