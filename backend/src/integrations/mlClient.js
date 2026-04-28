const axios = require('axios');
const logger = require('../utils/logger');

const analyzeThreat = async (logData) => {
  try {
    const mlUrl = process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001/api/predict';
    
    // Attempt to call the Python ML Service
    const response = await axios.post(mlUrl, logData, {
      timeout: 3000 // 3 seconds timeout
    });

    if (response.data && response.data.success) {
      return {
        anomalyScore: response.data.anomalyScore || 0,
        classification: response.data.classification || 'normal',
        threatAnalyzed: true
      };
    }
  } catch (error) {
    logger.warn(`ML Service unavailable or failed: ${error.message}. Using fallback detection.`);
  }

  // Fallback simple rule-based detection if ML service fails or is not available
  return fallbackDetection(logData);
};

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
    // Basic heuristics: if not already flagged, give a baseline score
    score = Math.max(score, 30); 
  }

  return {
    anomalyScore: score,
    classification: score > 70 ? classification : 'normal',
    threatAnalyzed: false // False indicates it used fallback, not ML
  };
};

module.exports = { analyzeThreat };
