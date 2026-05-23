/**
 * Classifier for Telemetry Features
 */

export const classifyThreat = (features = {}, anomalyScore = 0) => {
  // 1. Brute Force (Failed logins spike)
  if (features.failedLogins > 10) {
    return {
      attackType: "Brute Force",
      confidence: Math.round(Math.min(100, 75 + (features.failedLogins - 10) * 2.5))
    };
  }

  // 2. Recon (High requests/connections scan)
  if (features.requests > 800 || features.networkCount > 400) {
    const scoreVal = Math.max(
      (features.requests - 800) / 20,
      (features.networkCount - 400) / 10
    );
    return {
      attackType: "Recon",
      confidence: Math.round(Math.min(100, 70 + scoreVal))
    };
  }

  // 3. Malware (Extremely high CPU load combined with process spikes)
  if (features.cpuUsage > 85 && features.processCount > 450) {
    return {
      attackType: "Malware",
      confidence: Math.round(Math.min(100, 80 + (features.cpuUsage - 85) * 1.3))
    };
  }

  // 4. Suspicious Activity (General high anomalies)
  if (anomalyScore >= 0.5) {
    return {
      attackType: "Suspicious Activity",
      confidence: Math.round(anomalyScore * 100)
    };
  }

  // 5. Unknown (Normal profile or minor deviations)
  return {
    attackType: "Unknown",
    confidence: Math.round((1 - anomalyScore) * 100)
  };
};

export default {
  classifyThreat
};
