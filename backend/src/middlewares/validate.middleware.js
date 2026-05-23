import { validationResult } from "express-validator";
import logger from "../utils/logger.js";

/**
 * ==================================================
 * Validation middleware factory
 * Supports:
 *
 * validate(logValidator)
 * validate(userValidator)
 *
 * ==================================================
 */

const validate = (validations = []) => {
  return async (req, res, next) => {
    try {
      /*
      ============================
      Run validators
      ============================
      */

      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);

      /*
      ============================
      No validation errors
      ============================
      */

      if (errors.isEmpty()) {
        return next();
      }

      /*
      ============================
      Format validation errors
      ============================
      */

      const formattedErrors = errors.array().map((err) => ({
        field: err.path || err.param || "unknown",

        message: err.msg,

        value: err.value ?? null,
      }));

      /*
      ============================
      Internal logging
      ============================
      */

      logger.warn("Validation failed", {
        route: req.originalUrl,
        method: req.method,
        ip: req.ip,
        errors: formattedErrors,
      });

      /*
      ============================
      Safe client response
      ============================
      */

      return res.status(400).json({
        success: false,
        data: null,
        message: formattedErrors[0]?.message || "Request validation failed",

        errors: formattedErrors,
      });
    } catch (error) {
      logger.error("Validation middleware error", {
        error: error.message,
        stack: error.stack,
      });

      return res.status(500).json({
        success: false,
        message: "Validation error",
      });
    }
  };
};

export default validate;
