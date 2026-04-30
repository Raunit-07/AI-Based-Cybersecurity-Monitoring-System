const axios = require('axios');

const detectThreat = async (data) => {
  try {
    const response = await axios.post(
      process.env.ML_SERVICE_URL,
      data
    );

    return response.data;
  } catch (error) {
    console.error("ML Error:", error.message);

    // fallback
    return {
      is_anomaly: false,
      anomaly_score: 0,
      attack_type: 'fallback'
    };
  }
};

module.exports = { detectThreat };