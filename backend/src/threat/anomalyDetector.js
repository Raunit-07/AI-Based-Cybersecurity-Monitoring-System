/**
 * Anomaly Detector for Telemetry Features
 */

export const calculateAnomalyScore = (features = {}) => {
  let score = 0;

  // 1. CPU anomaly (contribution up to 0.4)
  if (features.cpuUsage > 80) {
    score += Math.min(0.4, (features.cpuUsage - 80) / 20);
  }

  // 2. Memory anomaly (contribution up to 0.4)
  if (features.memoryUsage > 85) {
    score += Math.min(0.4, (features.memoryUsage - 85) / 15);
  }

  // 3. Process count anomaly (contribution up to 0.3)
  if (features.processCount > 300) {
    score += Math.min(0.3, (features.processCount - 300) / 700);
  }

  // 4. Network connections anomaly (contribution up to 0.3)
  if (features.networkCount > 200) {
    score += Math.min(0.3, (features.networkCount - 200) / 800);
  }

  // 5. Failed logins anomaly (contribution up to 0.8)
  if (features.failedLogins > 1) {
    score += Math.min(0.8, (features.failedLogins - 1) / 9);
  }

  // 6. Request spike anomaly (contribution up to 0.7)
  if (features.requests > 100) {
    score += Math.min(0.7, (features.requests - 100) / 900);
  }

  const anomalyScore = Math.min(Math.max(score, 0), 1);
  const isAnomaly = anomalyScore >= 0.5;

  return {
    is_anomaly: isAnomaly,
    anomaly_score: Number(anomalyScore.toFixed(4))
  };
};

export default {
  calculateAnomalyScore
};
