import axios from "axios";

/**
 * ================================
 * AXIOS INSTANCE (PRODUCTION SAFE)
 * ================================
 */

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
  timeout: 10000, // prevent hanging requests
});

/**
 * ================================
 * REQUEST INTERCEPTOR
 * ================================
 * Attach token if present
 */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * ================================
 * RESPONSE INTERCEPTOR
 * ================================
 * Normalize responses + handle errors
 */
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Network error
    if (!error.response) {
      console.error("Network error:", error.message);
      return Promise.reject({
        success: false,
        error: "Network error. Please check your connection.",
      });
    }

    // Unauthorized (auto logout optional)
    if (error.response.status === 401) {
      console.warn("Unauthorized - clearing session");
      localStorage.removeItem("accessToken");
    }

    return Promise.reject({
      success: false,
      error:
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Something went wrong",
    });
  }
);

/**
 * ================================
 * ALERT APIs
 * ================================
 */

/**
 * Get all alerts
 */
export const fetchAlerts = async (params = {}) => {
  const res = await API.get("/alerts", { params });

  return res.data || [];
};

/**
 * Resolve alert
 */
export const resolveAlert = async (id) => {
  if (!id) throw new Error("Alert ID required");

  return await API.patch(`/alerts/${id}/resolve`);
};

/**
 * ================================
 * LOG INGESTION (REAL TRIGGER)
 * ================================
 */
export const sendLog = async (logData) => {
  if (!logData?.ip) {
    throw new Error("Invalid log data: IP required");
  }

  return await API.post("/logs", logData);
};

/**
 * ================================
 * AUTH APIs (OPTIONAL)
 * ================================
 */
export const login = async (data) => {
  const res = await API.post("/auth/login", data);

  if (res?.data?.token) {
    localStorage.setItem("accessToken", res.data.token);
  }

  return res;
};

export const logout = () => {
  localStorage.removeItem("accessToken");
};

export default API;