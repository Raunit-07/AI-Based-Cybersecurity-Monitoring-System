/**
 * Threat Engine Orchestrator for Telemetry Features
 */
import { extractFeatures } from "./featureExtractor.js";
import { calculateAnomalyScore } from "./anomalyDetector.js";
import { classifyThreat } from "./classifier.js";
import { scoreThreat } from "./threatScorer.js";

export const analyzeLog = (logData = {}) => {
  // 1. Extract features from telemetry
  const features = extractFeatures(logData);

  // 2. Anomaly scoring
  const anomalyResult = calculateAnomalyScore(features);

  // 3. Classification
  const classificationResult = classifyThreat(features, anomalyResult.anomaly_score);

  // 4. Scoring & Severity Mapping
  const scoringResult = scoreThreat(features, anomalyResult, classificationResult);

  return {
    is_anomaly: anomalyResult.is_anomaly,
    anomaly_score: anomalyResult.anomaly_score,
    attackType: classificationResult.attackType,
    threatScore: scoringResult.threatScore,
    confidenceScore: scoringResult.confidenceScore, // 0 - 100
    severity: scoringResult.severity,
    features
  };
};

export default {
  analyzeLog
};
