import { validationResult } from "express-validator";

/**
 * Central validation middleware for express-validator.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  console.log("DEBUG: Validate middleware triggered");

  if (!errors.isEmpty()) {
    console.log("DEBUG: Validation errors found:", JSON.stringify(errors.array(), null, 2));
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