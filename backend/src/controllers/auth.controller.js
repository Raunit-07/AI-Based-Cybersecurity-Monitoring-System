const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const apiResponse = require('../utils/apiResponse');

const setTokensInCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const register = catchAsync(async (req, res) => {
  const { username, password, role } = req.body;
  const user = await authService.registerUser(username, password, role);
  apiResponse(res, 201, true, { user }, 'User registered successfully');
});

const login = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.loginUser(username, password);
  
  setTokensInCookies(res, accessToken, refreshToken);

  // Return token in response to keep compatibility with current frontend `localStorage` approach
  // until frontend is fully refactored to use HttpOnly cookies.
  apiResponse(res, 200, true, { user, token: accessToken }, 'Login successful');
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;
  const { accessToken, refreshToken: newRefreshToken } = await authService.refreshAuthToken(token);
  
  setTokensInCookies(res, accessToken, newRefreshToken);
  
  apiResponse(res, 200, true, { token: accessToken }, 'Token refreshed successfully');
});

const logout = catchAsync(async (req, res) => {
  const userId = req.user ? req.user.id : null;
  if (userId) {
    await authService.logoutUser(userId);
  }
  
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  
  apiResponse(res, 200, true, {}, 'Logged out successfully');
});

module.exports = {
  register,
  login,
  refreshToken,
  logout
};
