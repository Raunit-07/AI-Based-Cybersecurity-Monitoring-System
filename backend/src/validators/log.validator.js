import { body } from "express-validator";

export const logValidator = [
  // ✅ IP validation
  body("ip")
    .isIP()
    .withMessage("Valid IP address is required"),

  // ✅ Requests (for DDoS detection)
  body("requests")
    .isInt({ min: 0, max: 10000 })
    .withMessage("Requests must be a valid number (0–10000)"),

  // ✅ Failed logins (for brute force)
  body("failedLogins")
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage("failedLogins must be a valid number"),

  // ✅ Endpoint
  body("endpoint")
    .notEmpty()
    .withMessage("Endpoint is required")
    .isString()
    .trim(),

  // ✅ Method
  body("method")
    .notEmpty()
    .withMessage("HTTP Method is required")
    .isIn(["GET", "POST", "PUT", "DELETE"])
    .withMessage("Invalid HTTP method"),

  // ✅ User Agent (optional)
  body("user_agent")
    .optional()
    .isString()
    .isLength({ max: 300 })
    .withMessage("Invalid user agent"),

  // ✅ Timestamp
  body("timestamp")
    .optional()
    .isISO8601()
    .withMessage("Invalid timestamp format"),
];