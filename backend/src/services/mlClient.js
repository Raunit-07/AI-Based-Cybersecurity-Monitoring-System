import axios from "axios";

// ================= CONFIG =================
const ML_BASE_URL =
  process.env.ML_SERVICE_URL || "http://localhost:8000/api/v1";

// ================= AXIOS INSTANCE =================
const mlClient = axios.create({
  baseURL: ML_BASE_URL,
  timeout: 5000,
});

// ================= CALL ML =================
export const detectThreat = async (data) => {
  try {
    // ================= VALIDATION =================
    if (!data || !data.ip) {
      throw new Error("Invalid data for ML detection");
    }

    // ================= PREPARE PAYLOAD =================
    const payload = {
      ip: data.ip,
      requests: data.requests || 0,
      failedLogins: data.failedLogins || 0,
      method: data.method || "GET",
      endpoint: data.endpoint || "/",
    };

    // ================= API CALL =================
    const response = await mlClient.post("/predict", payload);

    // ================= VALIDATE RESPONSE =================
    if (!response.data || !response.data.success) {
      throw new Error("Invalid ML response");
    }

    return response.data.data;

  } catch (error) {
    console.error(
      "ML Service Error:",
      error?.response?.data || error.message
    );

    // ================= SAFE FALLBACK =================
    return {
      is_anomaly: false,
      anomaly_score: 0,
      attackType: "fallback",
    };
  }
};