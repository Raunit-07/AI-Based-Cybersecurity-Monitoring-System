import crypto from "crypto";

export const generateApiKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashApiKey = (apiKey) => {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
};

export const compareApiKey = (storedHash, incomingKey) => {
  const incomingHash = hashApiKey(incomingKey);

  return crypto.timingSafeEqual(
    Buffer.from(storedHash),

    Buffer.from(incomingHash),
  );
};
