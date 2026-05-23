/**
 * Threat Scorer for Telemetry Features
 */

export const scoreThreat = (features = {}, anomalyResult = {}, classificationResult = {}) => {
  const anomalyScore = anomalyResult.anomaly_score || 0;
  const attackType = classificationResult.attackType || "Unknown";
  const confidence = classificationResult.confidence || 0;

  // 1. Calculate overall Threat Score (0.0 to 1.0)
  let threatScore = 0;
  if (attackType === "Unknown") {
    threatScore = anomalyScore * 0.3;
  } else if (attackType === "Suspicious Activity") {
    threatScore = anomalyScore;
  } else {
    // Escalate score for known threat categories
    threatScore = Math.max(anomalyScore, confidence / 100, 0.7);
  }

  threatScore = Math.min(Math.max(threatScore, 0), 1);

  // 2. Map severity
  let severity = "low";
  if (threatScore >= 0.85 || (attackType === "Brute Force" && features.failedLogins > 20)) {
    severity = "critical";
  } else if (threatScore >= 0.65) {
    severity = "high";
  } else if (threatScore >= 0.4) {
    severity = "medium";
  }

  return {
    threatScore: Number(threatScore.toFixed(4)),
    confidenceScore: confidence, // 0 - 100
    severity
  };
};

export default {
  scoreThreat
};
