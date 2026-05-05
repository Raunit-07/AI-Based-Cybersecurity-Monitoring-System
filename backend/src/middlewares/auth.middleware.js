import jwt from "jsonwebtoken";
import User from "../models/user.js"; // ✅ FIXED PATH

/**
 * ================= AUTH MIDDLEWARE =================
 * Supports:
 * - Cookie-based auth
 * - Bearer token auth
 * - Production-safe validation
 */
export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // ================= GET TOKEN FROM COOKIE =================
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    // ================= FALLBACK: AUTH HEADER =================
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // ================= NO TOKEN =================
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    // ================= VERIFY SECRET =================
    if (!process.env.JWT_ACCESS_SECRET) {
      throw new Error("JWT_ACCESS_SECRET not defined");
    }

    // ================= VERIFY TOKEN =================
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid or expired token",
      });
    }

    // ================= VALIDATE PAYLOAD =================
    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token payload",
      });
    }

    // ================= FETCH USER =================
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // ================= ATTACH USER =================
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("❌ Auth middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

/**
 * ================= ROLE-BASED ACCESS =================
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Access denied",
      });
    }
    next();
  };
};