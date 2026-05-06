import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";

/**
 * ================= TOKEN GENERATION =================
 */
const generateTokens = (userId, role = "user") => {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    const error = new Error(
      "SERVER CONFIG ERROR: JWT secrets are not defined in .env"
    );
    error.status = 500;
    throw error;
  }

  if (!userId) {
    const error = new Error("SERVER ERROR: User ID missing for token generation");
    error.status = 500;
    throw error;
  }

  const payload = {
    id: userId.toString(),
    role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

  return { accessToken, refreshToken };
};

/**
 * ================= SAFE USER RESPONSE =================
 */
const buildSafeUser = (user) => {
  if (!user) return null;

  return {
    id: user._id?.toString(),
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * ================= EMAIL NORMALIZER =================
 *
 * Important:
 * Do not use express-validator normalizeEmail().
 * It can modify Gmail addresses and make different emails look same.
 */
const normalizeEmailForDb = (email) => {
  return String(email || "").trim().toLowerCase();
};

/**
 * ================= REGISTER =================
 */
const registerUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmailForDb(email);

  const existingUser = await User.findOne({ email: normalizedEmail }).lean();

  if (existingUser) {
    console.error(`DEBUG: User.findOne returned true for ${normalizedEmail}`, existingUser);
    const error = new Error("User already exists with this email");
    error.status = 409;
    throw error;
  }

  try {
    const user = new User({
      email: normalizedEmail,
      password,
      role: "user",
    });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    user.refreshToken = refreshToken;
    await user.save();

    logger.info(`User registered: ${normalizedEmail}`);

    return {
      user: buildSafeUser(user),
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("DEBUG: Error in user.save()", error);
    if (error.code === 11000) {
      const duplicateError = new Error("User already exists with this email");
      duplicateError.status = 409;
      throw duplicateError;
    }

    throw error;
  }
};

/**
 * ================= LOGIN =================
 */
const loginUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error("Email and password required");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = normalizeEmailForDb(email);

  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password"
  );

  if (!user) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    const error = new Error("Invalid credentials");
    error.status = 401;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  user.refreshToken = refreshToken;
  await user.save();

  logger.info(`User logged in: ${normalizedEmail}`);

  return {
    user: buildSafeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * ================= REFRESH TOKEN =================
 */
const refreshAuthToken = async (token) => {
  if (!token) {
    const error = new Error("No refresh token provided");
    error.status = 401;
    throw error;
  }

  if (!process.env.JWT_REFRESH_SECRET) {
    const error = new Error(
      "SERVER CONFIG ERROR: JWT refresh secret is not defined"
    );
    error.status = 500;
    throw error;
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    const error = new Error("Invalid refresh token");
    error.status = 403;
    throw error;
  }

  if (!decoded?.id) {
    const error = new Error("Invalid refresh token payload");
    error.status = 403;
    throw error;
  }

  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    const error = new Error("Invalid refresh token");
    error.status = 403;
    throw error;
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    user._id,
    user.role
  );

  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * ================= LOGOUT =================
 */
const logoutUser = async (userId) => {
  if (!userId) return;

  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
  });
};

export default {
  registerUser,
  loginUser,
  refreshAuthToken,
  logoutUser,
};