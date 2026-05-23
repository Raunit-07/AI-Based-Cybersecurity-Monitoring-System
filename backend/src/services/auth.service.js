import crypto from "crypto";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import logger from "../utils/logger.js";

const createError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * TOKEN GENERATION
 */
const generateTokens = (userId, role) => {
  const payload = {
    id: userId.toString(),
    role,
  };

  return {
    accessToken: jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    }),

    refreshToken: jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    }),
  };
};

const buildSafeUser = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  apiKey: user.apiKey,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const registerUser = async (email, password) => {
  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    throw createError("User already exists", 409);
  }

  const user = new User({
    email,
    password,
  });

  const tokens = generateTokens(user._id, user.role);

  user.refreshToken = user.hashToken(tokens.refreshToken);

  await user.save();

  logger.info(`User registered: ${email}`);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({
    email,
  }).select("+password +refreshToken +apiKey");

  if (!user) {
    throw createError("Invalid credentials", 401);
  }

  const match = await user.comparePassword(password);

  if (!match) {
    throw createError("Invalid credentials", 401);
  }

  const tokens = generateTokens(user._id, user.role);

  user.lastLoginAt = new Date();

  user.refreshToken = user.hashToken(tokens.refreshToken);

  await user.save();

  logger.info(`User logged in: ${email}`);

  return {
    user: buildSafeUser(user),
    ...tokens,
  };
};

const refreshAuthToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user) {
    throw createError("User not found", 404);
  }

  if (user.refreshToken !== user.hashToken(token)) {
    throw createError("Invalid token", 403);
  }

  const tokens = generateTokens(user._id, user.role);

  user.refreshToken = user.hashToken(tokens.refreshToken);

  await user.save();

  return tokens;
};

const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
  });
};

const getUserApiKey = async (userId) => {
  const user = await User.findById(userId).select("+apiKey");

  return user.apiKey;
};

const regenerateApiKey = async (userId) => {
  const apiKey = crypto.randomBytes(32).toString("hex");

  await User.findByIdAndUpdate(userId, { apiKey });

  return apiKey;
};

export default {
  registerUser,
  loginUser,
  refreshAuthToken,
  logoutUser,
  getUserApiKey,
  regenerateApiKey,
};
