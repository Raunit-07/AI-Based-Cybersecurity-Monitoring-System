import { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { useQueryClient } from '@tanstack/react-query';

export const useLiveTraffic = () => {
  const [trafficData, setTrafficData] = useState([]);
  const [isConnected, setIsConnected] = useState(socket.connected);
  const queryClient = useQueryClient();

  useEffect(() => {
    socket.connect();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    
    const onTrafficUpdate = (data) => {
      setTrafficData((prev) => {
        const newData = [...prev, data];
        if (newData.length > 20) newData.shift(); // Keep last 20 data points
        return newData;
      });
    };

    const onNewAlert = (alert) => {
      queryClient.setQueryData(['alerts'], (oldData) => {
        if (!oldData) return [alert];
        return [alert, ...oldData].slice(0, 50); // Keep max 50 alerts
      });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('traffic_update', onTrafficUpdate);
    socket.on('new_alert', onNewAlert);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('traffic_update', onTrafficUpdate);
      socket.off('new_alert', onNewAlert);
      socket.disconnect();
    };
  }, [queryClient]);

  return { trafficData, isConnected };
};
