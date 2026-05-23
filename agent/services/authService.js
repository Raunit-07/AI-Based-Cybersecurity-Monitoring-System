import { apiClient, requestWithRetry } from './apiClient.js';

export const sendHeartbeat = async (status = 'online') => {
  const deviceId = process.env.DEVICE_ID;
  return requestWithRetry(async () => {
    const res = await apiClient.post('/devices/heartbeat', {
      deviceId,
      status,
    });
    return res.data;
  });
};

export const sendTelemetry = async (payload) => {
  return requestWithRetry(async () => {
    const res = await apiClient.post('/logs', payload);
    return res.data;
  });
};
