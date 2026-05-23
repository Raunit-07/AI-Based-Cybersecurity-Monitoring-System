import validator from "validator";

/**
 * Validate device registration payload.
 * Expected fields: deviceId (string, min 10), hostname (string), os (one of allowed values).
 * Returns an array of error messages; empty array means valid.
 */
export const validateRegister = (payload = {}) => {
  const errors = [];
  const { deviceId, hostname, os } = payload;

  if (!deviceId || typeof deviceId !== "string" || deviceId.trim().length < 10) {
    errors.push("deviceId must be a string with at least 10 characters");
  }
  if (!hostname || typeof hostname !== "string" || !hostname.trim()) {
    errors.push("hostname is required");
  }
  const allowedOs = ["windows", "linux", "macos", "ubuntu", "debian", "centos", "unknown"];
  if (!os || !allowedOs.includes(os)) {
    errors.push(`os must be one of ${allowedOs.join(", ")}`);
  }

  return errors;
};

/**
 * Validate device update payload.
 * Allows optional hostname, os, metadata, status, ipAddress, localIp, agentVersion.
 */
export const validateUpdate = (payload = {}) => {
  const errors = [];
  const { hostname, os, status, ipAddress, localIp, agentVersion, metadata } = payload;

  if (hostname && typeof hostname !== "string") errors.push("hostname must be a string");
  if (os) {
    const allowedOs = ["windows", "linux", "macos", "ubuntu", "debian", "centos", "unknown"];
    if (!allowedOs.includes(os)) errors.push(`os must be one of ${allowedOs.join(", ")}`);
  }
  if (status) {
    const allowedStatus = ["online", "offline", "inactive", "quarantined"];
    if (!allowedStatus.includes(status)) errors.push(`status must be one of ${allowedStatus.join(", ")}`);
  }
  if (ipAddress && !validator.isIP(ipAddress)) errors.push("ipAddress must be a valid IP");
  if (localIp && !validator.isIP(localIp)) errors.push("localIp must be a valid IP");
  if (agentVersion && typeof agentVersion !== "string") errors.push("agentVersion must be a string");
  if (metadata && typeof metadata !== "object") errors.push("metadata must be an object");

  return errors;
};

/**
 * Validate heartbeat payload.
 * Optional fields: heartbeatAt, cpuUsage, memoryUsage, compromised, isolated.
 */
export const validateHeartbeat = (payload = {}) => {
  const errors = [];
  const { cpuUsage, memoryUsage, compromised, isolated } = payload;
  if (cpuUsage !== undefined && typeof cpuUsage !== "number") errors.push("cpuUsage must be a number");
  if (memoryUsage !== undefined && typeof memoryUsage !== "number") errors.push("memoryUsage must be a number");
  if (compromised !== undefined && typeof compromised !== "boolean") errors.push("compromised must be a boolean");
  if (isolated !== undefined && typeof isolated !== "boolean") errors.push("isolated must be a boolean");
  return errors;
};
