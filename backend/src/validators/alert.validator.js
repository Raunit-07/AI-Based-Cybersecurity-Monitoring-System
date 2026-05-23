import validator from "validator";

export const validateCreateAlert = (data) => {
  const errors = [];
  if (!data.ip || !validator.isIP(String(data.ip).trim())) {
    errors.push("Invalid or missing IP");
  }
  if (data.anomalyScore !== undefined) {
    const score = Number(data.anomalyScore);
    if (isNaN(score) || score < 0 || score > 1) {
      errors.push("anomalyScore must be a number between 0 and 1");
    }
  }
  if (
    data.severity &&
    !["low", "medium", "high", "critical"].includes(data.severity)
  ) {
    errors.push("Invalid severity level");
  }
  return errors;
};

export const validateUpdateStatus = (status) => {
  const allowed = ["active", "investigating", "resolved", "closed"];
  if (!allowed.includes(status)) {
    return [`Status must be one of ${allowed.join(", ")}`];
  }
  return [];
};
