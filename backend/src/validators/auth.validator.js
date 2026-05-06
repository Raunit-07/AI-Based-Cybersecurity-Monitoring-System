import { body } from "express-validator";

/**
 * ================= REGISTER VALIDATOR =================
 */
export const registerValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Must be a valid email address")
    .bail()
    .customSanitizer((value) => String(value).trim().toLowerCase()),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 6, max: 128 })
    .withMessage("Password must be between 6 and 128 characters"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Confirm password is required")
    .bail()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }

      return true;
    }),

  /**
   * Security:
   * Never allow public register API to create admin users.
   */
  body("role").optional().customSanitizer(() => "user"),
];

/**
 * ================= LOGIN VALIDATOR =================
 */
export const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Valid email is required")
    .bail()
    .customSanitizer((value) => String(value).trim().toLowerCase()),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 1, max: 128 })
    .withMessage("Invalid password"),
];