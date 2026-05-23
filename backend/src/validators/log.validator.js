import { body } from "express-validator";

export const logValidator = [
  // Validate root payload
  body().isObject().withMessage("Payload must be a valid object"),

  // IP address
  body("logs.*.ip")
    .exists()
    .withMessage("IP address is required")
    .bail()
    .isIP()
    .withMessage("Invalid IP address")
    .trim(),

  // Request count
  body("requests")
    .exists()
    .withMessage("Requests field is required")
    .bail()
    .isInt({
      min: 0,
      max: 100000,
    })
    .withMessage("Requests must be between 0 and 100000")
    .toInt(),

  // Failed logins
  body("failedLogins")
    .optional()
    .isInt({
      min: 0,
      max: 10000,
    })
    .withMessage("failedLogins must be between 0 and 10000")
    .toInt(),

  // Endpoint
  body("endpoint")
    .exists()
    .withMessage("Endpoint is required")
    .bail()
    .isString()
    .withMessage("Endpoint must be string")
    .trim()
    .isLength({
      min: 1,
      max: 500,
    })
    .withMessage("Endpoint length must be between 1 and 500"),

  // HTTP Method
  body("method")
    .exists()
    .withMessage("HTTP Method is required")
    .bail()
    .trim()
    .toUpperCase()
    .isIn(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"])
    .withMessage("Invalid HTTP method"),

  // Status code
  body("statusCode")
    .optional()
    .isInt({
      min: 100,
      max: 599,
    })
    .withMessage("Status code must be between 100 and 599")
    .toInt(),

  // User agent
  body("user_agent")
    .optional()
    .trim()
    .isString()
    .withMessage("User agent must be string")
    .isLength({
      max: 500,
    })
    .withMessage("User agent too long"),

  // Referrer
  body("referrer")
    .optional()
    .trim()
    .isLength({
      max: 1000,
    })
    .withMessage("Referrer too long"),

  // Timestamp
  body("timestamp")
    .optional()
    .isISO8601()
    .withMessage("Timestamp must be valid ISO8601")
    .toDate(),
];
