/**
 * Feature Extractor for Telemetry Metrics
 */

export const extractFeatures = (logData = {}) => {
  const metadata = logData.metadata || {};
  const systemInfo = metadata.systemInfo || {};

  // 1. CPU Usage
  let cpuUsage = 0;
  if (typeof systemInfo.cpuUsage === "number") {
    cpuUsage = systemInfo.cpuUsage;
  } else if (typeof logData.cpuUsage === "number") {
    cpuUsage = logData.cpuUsage;
  }

  // 2. Memory/RAM Usage
  let memoryUsage = 0;
  if (typeof systemInfo.memoryUsage === "number") {
    memoryUsage = systemInfo.memoryUsage;
  } else if (typeof logData.memoryUsage === "number") {
    memoryUsage = logData.memoryUsage;
  }

  // 3. Process Count (Parse from summary or take list length)
  let processCount = 0;
  if (metadata.processesSummary) {
    const match = String(metadata.processesSummary).match(/(\d+)/);
    if (match) {
      processCount = parseInt(match[1], 10);
    }
  } else if (Array.isArray(metadata.processes)) {
    processCount = metadata.processes.length;
  } else if (typeof logData.processCount === "number") {
    processCount = logData.processCount;
  }

  // 4. Network Count (Parse from summary or take connection length)
  let networkCount = 0;
  if (metadata.networkSummary) {
    const match = String(metadata.networkSummary).match(/(\d+)/);
    if (match) {
      networkCount = parseInt(match[1], 10);
    }
  } else if (Array.isArray(metadata.network)) {
    networkCount = metadata.network.length;
  } else if (typeof logData.networkCount === "number") {
    networkCount = logData.networkCount;
  }

  // 5. Failed Logins
  const failedLogins = Math.max(0, Number(logData.failedLogins ?? 0));

  // 6. Requests (indicating request spikes)
  const requests = Math.max(0, Number(logData.requests ?? 1));

  return {
    cpuUsage,
    memoryUsage,
    processCount,
    networkCount,
    failedLogins,
    requests
  };
};

export default {
  extractFeatures
};
