import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Auth Middleware (Production Ready)
 * Supports:
 * 1. Cookie-based auth (accessToken)
 * 2. Bearer token (Authorization header)
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

    // ================= FETCH USER =================
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not found",
      });
    }

    // ================= ATTACH USER =================
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};
