export const apiKeyAuth = (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API key missing",
      });
    }

    if (apiKey !== process.env.LOG_API_KEY) {
      return res.status(403).json({
        success: false,
        message: "Invalid API key",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "API key validation failed",
    });
  }
};