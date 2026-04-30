import jwt from "jsonwebtoken";
import User from "../models/User.js";

// ================= TOKEN GENERATION =================
const generateTokens = (userId, role) => {
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
const registerUser = async (username, password, role = "user") => {
  const existingUser = await User.findOne({ username });

  if (existingUser) {
    const error = new Error("Username already exists");
    error.status = 400;
    throw error;
  }

  const user = new User({ username, password, role });
  await user.save();

  return user;
};

// ================= LOGIN =================
const loginUser = async (username, password) => {
const user = await User.findOne({ username }).select("+password +refreshToken");
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

  return { user, accessToken, refreshToken };
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

  return { accessToken, refreshToken: newRefreshToken };
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