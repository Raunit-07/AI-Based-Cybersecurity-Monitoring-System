import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const DEVICE_ID = process.env.DEVICE_ID;
const DEVICE_KEY = process.env.DEVICE_KEY;

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const currentDeviceId = process.env.DEVICE_ID || DEVICE_ID;
  const currentDeviceKey = process.env.DEVICE_KEY || DEVICE_KEY;
  if (currentDeviceId && currentDeviceKey) {
    config.headers['x-device-id'] = currentDeviceId;
    config.headers['x-device-key'] = currentDeviceKey;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const requestWithRetry = async (requestFn, maxRetries = 5, initialDelay = 1000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`[API Client] Request failed. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
