import User from "../models/User.js";

/**
 * =========================================
 * API KEY AUTH MIDDLEWARE
 * Multi-user secure ingestion
 * =========================================
 */
export const apiKeyAuth = async (
  req,
  res,
  next
) => {
  try {
    // ================= GET API KEY =================
    const apiKey =
      req.headers["x-api-key"];

    // ================= VALIDATE EXISTENCE =================
    if (
      !apiKey ||
      typeof apiKey !== "string"
    ) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "API key missing",
      });
    }

    // ================= SANITIZE =================
    const cleanApiKey =
      apiKey.trim();

    // ================= FIND USER =================
    const user =
      await User.findOne({
        apiKey: cleanApiKey,
      }).select(
        "_id email username apiKey role"
      );

    // ================= INVALID KEY =================
    if (!user) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "Invalid API key",
      });
    }

    // ================= ATTACH USER =================
    req.systemUser = user;

    next();
  } catch (error) {
    console.error(
      "❌ API key auth error:",
      error
    );

    return res.status(500).json({
      success: false,
      data: null,
      message:
        "API key validation failed",
    });
  }
};