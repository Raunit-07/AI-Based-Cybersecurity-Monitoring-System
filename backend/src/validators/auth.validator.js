import { body } from "express-validator";

// ================= REGISTER VALIDATOR =================
export const registerValidator = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters"),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .optional()
    .isIn(["user", "admin"])
    .withMessage("Invalid role"),
];

// ================= LOGIN VALIDATOR =================
export const loginValidator = [
  body("username")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Username is required"),

  body("email")
    .optional()
    .trim()
    .notEmpty()
    .isEmail()
    .withMessage("Valid email is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];