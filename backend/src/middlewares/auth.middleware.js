import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";

/**
 * ================= AUTH MIDDLEWARE =================
 */
export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Unauthorized: Access token missing",
      });
    }

    if (!process.env.JWT_ACCESS_SECRET) {
      return res.status(500).json({
        success: false,
        data: null,
        message: "Internal server configuration error",
      });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        data: null,
        message:
          err.name === "TokenExpiredError"
            ? "Unauthorized: Token expired"
            : "Unauthorized: Invalid token",
      });
    }

    if (!decoded?.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Unauthorized: Invalid token payload",
      });
    }

    const user = await User.findById(decoded.id).select("-password").lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: "Unauthorized: User no longer exists",
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return next();
  } catch (error) {
    return next(error);
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
        data: null,
        message: "Forbidden: Access denied",
      });
    }

    return next();
  };
};