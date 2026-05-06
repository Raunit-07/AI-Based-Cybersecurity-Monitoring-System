const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Calls the Python FastAPI ML microservice.
 * Maps backend log fields to the ML service's PredictionRequest Pydantic schema.
 */
const analyzeThreat = async (logData) => {
  try {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5000/api/v1/predict';

    const payload = {
      ip: logData.sourceIp || logData.ip || '0.0.0.0',
      request_count: logData.requestCount || logData.request_count || 1,
      endpoint: logData.endpoint || logData.path || '/',
      method: (logData.method || 'GET').toUpperCase(),
      timestamp: logData.timestamp || new Date().toISOString(),
      user_agent: logData.userAgent || logData.user_agent || 'unknown'
    };

    const response = await axios.post(mlUrl, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data && response.data.success) {
      const data = response.data.data;
      // ML service returns 0-1 normalized score; convert to 0-100 scale
      const anomalyScore = Math.round(data.anomaly_score * 100);
      return {
        anomalyScore,
        classification: data.attackType || 'normal',
        threatAnalyzed: true
      };
    }
  } catch (error) {
    logger.warn(`ML Service unavailable or failed: ${error.message}. Using fallback detection.`);
  }

  return fallbackDetection(logData);
};

/**
 * Rule-based fallback if ML service is unreachable.
 */
const fallbackDetection = (logData) => {
  let score = 0;
  let classification = 'normal';

  const suspiciousPayloads = ['<SCRIPT>', 'DROP TABLE', 'UNION SELECT', 'OR 1=1', 'SELECT * FROM', 'SLEEP(', 'WAITFOR DELAY'];

  if (logData.payload) {
    const payloadStr = JSON.stringify(logData.payload).toUpperCase();
    if (suspiciousPayloads.some(p => payloadStr.includes(p))) {
      score = 95;
      classification = 'SQL Injection / XSS Attempt';
    }
  }

  if (logData.method === 'POST' && logData.endpoint === '/api/login') {
    score = Math.max(score, 30);
  }

  return {
    anomalyScore: score,
    classification: score > 70 ? classification : 'normal',
    threatAnalyzed: false
  };
};

module.exports = { analyzeThreat };
