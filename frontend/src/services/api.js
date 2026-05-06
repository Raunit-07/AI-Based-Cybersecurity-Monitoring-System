import axios from "axios";

/**
 * ================================
 * AXIOS INSTANCE
 * ================================
 */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * ================================
 * REQUEST INTERCEPTOR
 * ================================
 */
API.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

/**
 * ================================
 * RESPONSE INTERCEPTOR
 * ================================
 */
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      return Promise.reject({
        success: false,
        status: 0,
        message:
          "Network error. Please check your connection or backend server.",
        errors: [],
        raw: null,
      });
    }

    const status = error.response.status;
    const data = error.response.data || {};

    return Promise.reject({
      success: false,
      status,
      message: data.message || data.error || "Something went wrong",
      errors: Array.isArray(data.errors) ? data.errors : [],
      raw: data,
    });
  }
);

/**
 * ================================
 * AUTH APIs
 * ================================
 */
export const register = async (data) => {
  return await API.post("/auth/register", data);
};

export const login = async (data) => {
  return await API.post("/auth/login", data);
};

export const logout = async () => {
  return await API.post("/auth/logout");
};

export const getMe = async () => {
  return await API.get("/auth/me");
};

/**
 * ================================
 * ALERT APIs
 * ================================
 */
export const fetchAlerts = async (params = {}) => {
  const res = await API.get("/alerts", { params });

  // After interceptor unwrap: res = {success, data: {alerts, total}, message}
  if (Array.isArray(res?.data?.alerts)) return res.data.alerts;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;

  return [];
};

export const resolveAlert = async (id) => {
  if (!id) throw new Error("Alert ID required");

  return await API.patch(`/alerts/${id}/resolve`);
};

/**
 * ================================
 * LOG INGESTION
 * ================================
 */
export const sendLog = async (logData) => {
  if (!logData?.ip) {
    throw new Error("Invalid log data: IP required");
  }

  return await API.post("/logs", logData);
};

export default API;