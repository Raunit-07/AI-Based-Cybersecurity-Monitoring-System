const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateTokens = (userId, role) => {
  const payload = { id: userId, role };
  
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET || 'secret',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
  
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

const registerUser = async (username, password, role) => {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    const error = new Error('Username already exists');
    error.statusCode = 400;
    throw error;
  }
  
  const user = new User({ username, password, role });
  await user.save();
  return user;
};

const loginUser = async (username, password) => {
  const user = await User.findOne({ username });
  if (!user) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user._id, user.role);

  user.refreshToken = refreshToken;
  await user.save();

  return { user, accessToken, refreshToken };
};

const refreshAuthToken = async (token) => {
  if (!token) {
    const error = new Error('No refresh token provided');
    error.statusCode = 401;
    throw error;
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== token) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 403;
    throw error;
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
  
  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken, refreshToken: newRefreshToken };
};

const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

module.exports = {
  registerUser,
  loginUser,
  refreshAuthToken,
  logoutUser
};
