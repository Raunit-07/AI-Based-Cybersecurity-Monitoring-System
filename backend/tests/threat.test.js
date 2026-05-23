import { extractFeatures } from "../src/threat/featureExtractor.js";
import { calculateAnomalyScore } from "../src/threat/anomalyDetector.js";
import { classifyThreat } from "../src/threat/classifier.js";
import { scoreThreat } from "../src/threat/threatScorer.js";
import { analyzeLog } from "../src/threat/threatEngine.js";

describe("Telemetry Threat Detection Engine - Unit Tests", () => {
  describe("Feature Extractor", () => {
    it("should extract telemetry features from log containing metadata systemInfo", () => {
      const log = {
        requests: 10,
        failedLogins: 2,
        metadata: {
          systemInfo: {
            cpuUsage: 15.5,
            memoryUsage: 60.2
          },
          processesSummary: "150 processes",
          networkSummary: "45 connections"
        }
      };
      const features = extractFeatures(log);
      expect(features.cpuUsage).toBe(15.5);
      expect(features.memoryUsage).toBe(60.2);
      expect(features.processCount).toBe(150);
      expect(features.networkCount).toBe(45);
      expect(features.failedLogins).toBe(2);
      expect(features.requests).toBe(10);
    });

    it("should fallback to direct log features when metadata is missing", () => {
      const log = {
        requests: 10,
        failedLogins: 0,
        cpuUsage: 12.3,
        memoryUsage: 55.4,
        processCount: 120,
        networkCount: 30
      };
      const features = extractFeatures(log);
      expect(features.cpuUsage).toBe(12.3);
      expect(features.memoryUsage).toBe(55.4);
      expect(features.processCount).toBe(120);
      expect(features.networkCount).toBe(30);
    });
  });

  describe("Anomaly Detector", () => {
    it("should return anomaly score of 0 for normal baseline telemetry", () => {
      const features = {
        cpuUsage: 10,
        memoryUsage: 50,
        processCount: 100,
        networkCount: 50,
        failedLogins: 0,
        requests: 5
      };
      const res = calculateAnomalyScore(features);
      expect(res.is_anomaly).toBe(false);
      expect(res.anomaly_score).toBe(0);
    });

    it("should calculate anomaly for CPU and memory usage spikes", () => {
      const features = {
        cpuUsage: 95, // +0.3
        memoryUsage: 90, // +0.13
        processCount: 100,
        networkCount: 50,
        failedLogins: 0,
        requests: 5
      };
      const res = calculateAnomalyScore(features);
      expect(res.anomaly_score).toBeGreaterThan(0.3);
    });

    it("should flag anomaly for high request volume spikes", () => {
      const features = {
        cpuUsage: 10,
        memoryUsage: 50,
        processCount: 100,
        networkCount: 50,
        failedLogins: 0,
        requests: 850
      };
      const res = calculateAnomalyScore(features);
      expect(res.is_anomaly).toBe(true);
      expect(res.anomaly_score).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe("Classifier", () => {
    it("should classify brute force logins", () => {
      const features = { failedLogins: 15 };
      const res = classifyThreat(features, 0.85);
      expect(res.attackType).toBe("Brute Force");
      expect(res.confidence).toBeGreaterThanOrEqual(75);
      expect(res.confidence).toBeLessThanOrEqual(100);
    });

    it("should classify connection spikes as Recon", () => {
      const features = { requests: 950, networkCount: 450, failedLogins: 0 };
      const res = classifyThreat(features, 0.9);
      expect(res.attackType).toBe("Recon");
      expect(res.confidence).toBeGreaterThanOrEqual(70);
    });

    it("should classify massive load as Malware", () => {
      const features = { cpuUsage: 95, processCount: 550, failedLogins: 0 };
      const res = classifyThreat(features, 0.88);
      expect(res.attackType).toBe("Malware");
      expect(res.confidence).toBeGreaterThanOrEqual(80);
    });

    it("should classify generic anomalies as Suspicious Activity", () => {
      const features = { cpuUsage: 10, failedLogins: 0 };
      const res = classifyThreat(features, 0.65);
      expect(res.attackType).toBe("Suspicious Activity");
      expect(res.confidence).toBe(65);
    });

    it("should classify normal profiles as Unknown", () => {
      const features = { cpuUsage: 10, failedLogins: 0 };
      const res = classifyThreat(features, 0.1);
      expect(res.attackType).toBe("Unknown");
      expect(res.confidence).toBe(90);
    });
  });

  describe("Threat Scorer", () => {
    it("should score Brute Force with high/critical severity", () => {
      const features = { failedLogins: 25 };
      const anomaly = { anomaly_score: 0.9, is_anomaly: true };
      const classification = { attackType: "Brute Force", confidence: 95 };

      const res = scoreThreat(features, anomaly, classification);
      expect(res.severity).toBe("critical");
      expect(res.threatScore).toBeGreaterThanOrEqual(0.95);
      expect(res.confidenceScore).toBe(95);
    });

    it("should score Suspicious Activity with medium severity", () => {
      const features = { failedLogins: 0 };
      const anomaly = { anomaly_score: 0.55, is_anomaly: true };
      const classification = { attackType: "Suspicious Activity", confidence: 55 };

      const res = scoreThreat(features, anomaly, classification);
      expect(res.severity).toBe("medium");
      expect(res.threatScore).toBe(0.55);
    });
  });

  describe("Orchestrated Threat Engine", () => {
    it("should evaluate raw log with telemetry metadata and output correct report", () => {
      const log = {
        requests: 950,
        failedLogins: 15,
        metadata: {
          systemInfo: {
            cpuUsage: 12.5,
            memoryUsage: 80.4
          },
          processesSummary: "358 processes",
          networkSummary: "231 connections"
        }
      };

      const report = analyzeLog(log);
      expect(report.is_anomaly).toBe(true);
      expect(report.anomaly_score).toBeGreaterThan(0.5);
      expect(report.attackType).toBe("Brute Force");
      expect(report.confidenceScore).toBeGreaterThanOrEqual(75);
      expect(report.severity).toBe("critical");
    });
  });
});
