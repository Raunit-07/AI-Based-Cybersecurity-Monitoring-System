import axios from "axios";

// ================= CONFIG =================
const ML_BASE_URL =
  "https://threatops-ml-service.onrender.com/api/v1";

  console.log("ML_SERVICE_URL =", process.env.ML_SERVICE_URL);
  console.log("ML_BASE_URL =", ML_BASE_URL);
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

    console.log("PAYLOAD:", payload);
    // ================= API CALL =================
    const response = await mlClient.post("/predict", payload);

    // ================= VALIDATE RESPONSE =================
    if (!response.data || !response.data.success) {
      throw new Error("Invalid ML response");
    }
    return response.data.data;
  } catch (error) {
    console.error("ML FULL ERROR");
    console.dir(error, { depth: null });
    console.log("ML URL:", mlClient.defaults.baseURL);
    // console.log("PAYLOAD:", payload);

    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);
    console.log("MESSAGE:", error.message);

    // Extract response JSON if available
    let responseJson = null;
    if (error.response && error.response.data) {
      responseJson = error.response.data;
    } else if (typeof error.message === "string") {
      try {
        // Try to parse JSON from error message if it looks like JSON
        const jsonMatch = error.message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          responseJson = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        // Ignore parsing errors, we'll use the default fallback
      }
    }

    console.log("Response JSON:", responseJson);
    // ================= SAFE FALLBACK =================
    return {
      is_anomaly: false,
      anomaly_score: 0,
      attackType: "fallback",
    };
  }
};