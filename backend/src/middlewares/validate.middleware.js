import { validationResult } from "express-validator";

/**
 * Central validation middleware for express-validator.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param || "unknown",
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      data: null,
      message: formattedErrors[0]?.message || "Validation failed",
      errors: formattedErrors,
    });
  }

  return next();
};

export default validate;