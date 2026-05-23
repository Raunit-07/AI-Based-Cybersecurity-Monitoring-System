import crypto from "crypto";

export const hashApiKey = (apiKey) => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

export const generateApiKey = () => {
  return crypto.randomBytes(32).toString("hex");
};
