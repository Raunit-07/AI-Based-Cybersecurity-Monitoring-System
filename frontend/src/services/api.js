import axios from "axios";

/**
 * ================================
 * AXIOS INSTANCE
 * ================================
 */
const BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/**
 * ================================
 * AXIOS CONFIG
 * ================================
 */
const API = axios.create({
  baseURL: BASE_URL,

  // Required for cookie auth
  withCredentials: true,

  timeout: 10000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * ================================
 * REQUEST INTERCEPTOR
 * ================================
 */
API.interceptors.request.use(
  (config) => {
    return config;
  },
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
    // Network / backend unavailable
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

      message:
        data.message ||
        data.error ||
        "Something went wrong",

      errors: Array.isArray(data.errors)
        ? data.errors
        : [],

      raw: data,
    });
  }
);

/**
 * ================================
 * AUTH APIs
 * ================================
 */

/**
 * Register User
 */
export const register = async (data) => {
  return await API.post(
    "/auth/register",
    data
  );
};

/**
 * Login User
 */
export const login = async (data) => {
  return await API.post(
    "/auth/login",
    data
  );
};

/**
 * Logout User
 */
export const logout = async () => {
  return await API.post(
    "/auth/logout"
  );
};

/**
 * Current User
 */
export const getMe = async () => {
  return await API.get(
    "/auth/me"
  );
};

/**
 * ================================
 * ALERT APIs
 * ================================
 */

/**
 * Fetch Alerts
 */
export const fetchAlerts = async (
  params = {}
) => {
  const res = await API.get(
    "/alerts",
    { params }
  );

  /**
   * After interceptor:
   * res = {
   *   success,
   *   data,
   *   message
   * }
   */

  if (
    Array.isArray(res?.data?.alerts)
  ) {
    return res.data.alerts;
  }

  if (
    Array.isArray(res?.data)
  ) {
    return res.data;
  }

  if (Array.isArray(res)) {
    return res;
  }

  return [];
};

/**
 * Resolve Alert
 */
export const resolveAlert = async (
  id
) => {
  if (!id) {
    throw new Error(
      "Alert ID required"
    );
  }

  return await API.patch(
    `/alerts/${id}/resolve`
  );
};

/**
 * ================================
 * SUSPICIOUS IP APIs
 * ================================
 */

/**
 * Fetch Suspicious IPs
 */
export const fetchSuspiciousIPs =
  async (limit = 20) => {
    const res = await API.get(
      "/alerts/suspicious-ips",
      {
        params: { limit },
      }
    );

    /**
     * Expected:
     * {
     *   success: true,
     *   data: {
     *     ips: [...]
     *   }
     * }
     */

    if (
      Array.isArray(res?.data?.ips)
    ) {
      return res.data.ips;
    }

    return [];
  };

/**
 * Fetch Alert Statistics
 */
export const fetchAlertStats =
  async () => {
    const res = await API.get(
      "/alerts/stats"
    );

    return res?.data || {};
  };

/**
 * ================================
 * LOG INGESTION APIs
 * ================================
 */

/**
 * Send Log Data
 */
export const sendLog = async (
  logData
) => {
  if (!logData?.ip) {
    throw new Error(
      "Invalid log data: IP required"
    );
  }

  return await API.post(
    "/logs",
    logData
  );
};

/**
 * ================================
 * EXPORT AXIOS INSTANCE
 * ================================
 */
export default API;