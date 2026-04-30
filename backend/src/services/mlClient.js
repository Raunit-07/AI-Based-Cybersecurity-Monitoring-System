import axios from "axios";

// ================= ML CLIENT =================
export const detectThreat = async (data) => {
  try {
    // ✅ Basic validation safeguard
    if (!data || !data.ip) {
      throw new Error("Invalid data for ML detection");
    }

    const response = await axios.post(
      process.env.ML_SERVICE_URL,
      {
        ip: data.ip,
        requests: data.requests || 0,
        failedLogins: data.failedLogins || 0,
      },
      {
        timeout: 5000, // ⏱ prevent hanging requests
      }
    );

    return response.data;
  } catch (error) {
    console.error("ML Service Error:", error.message);

    // ✅ Safe fallback (prevents system crash)
    return {
      is_anomaly: false,
      anomaly_score: 0,
      attack_type: "fallback",
    };
  }
};