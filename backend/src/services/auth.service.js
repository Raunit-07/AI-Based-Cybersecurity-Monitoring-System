import jwt from "jsonwebtoken";
import User from "../models/User.js"; // ✅ FIXED (lowercase)
import logger from "../utils/logger.js";

// ================= TOKEN GENERATION =================
const generateTokens = (userId, role) => {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT secrets are not defined in .env");
  }

  const payload = { id: userId, role };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m" }
  );

  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );

  return { accessToken, refreshToken };
};

// ================= REGISTER =================
const registerUser = async (email, password, role = "user") => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.status = 400;
    throw error;
  }

  email = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("User already exists");
    error.status = 400;
    throw error;
  }

  const user = new User({
    email,
    password,
    role,
  });

  // Save first → ensures DB consistency
  await user.save();

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

// ================= LOGIN =================
const loginUser = async (email, password) => {
  if (!email || !password) {
    const error = new Error("Email and password required");
    error.status = 400;
    throw error;
  }

  email = email.toLowerCase().trim();

  const user = await User.findOne({ email }).select("+password");

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

  await User.findByIdAndUpdate(user._id, { refreshToken });

  logger.info(`User logged in: ${email}`);

  return {
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
};

// ================= REFRESH TOKEN =================
const refreshAuthToken = async (token) => {
  if (!token) {
    const error = new Error("No refresh token provided");
    error.status = 401;
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

  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    const error = new Error("Invalid refresh token");
    error.status = 403;
    throw error;
  }

  const { accessToken, refreshToken: newRefreshToken } =
    generateTokens(user._id, user.role);

  user.refreshToken = newRefreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

// ================= LOGOUT =================
const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

// ================= EXPORT =================
export default {
  registerUser,
  loginUser,
  refreshAuthToken,
  logoutUser,
};