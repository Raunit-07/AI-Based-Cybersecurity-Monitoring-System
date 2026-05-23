import authService from "../services/auth.service.js";
import apiResponse from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";

/**
 * =====================================
 * COOKIE OPTIONS
 * =====================================
 */
const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  };
};

/**
 * =====================================
 * SET AUTH COOKIES
 * =====================================
 */
const setTokensInCookies = (res, accessToken, refreshToken) => {
  const cookieOptions = getCookieOptions();

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

/**
 * =====================================
 * CLEAR COOKIES
 * =====================================
 */
const clearTokens = (res) => {
  const cookieOptions = getCookieOptions();

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

/**
 * =====================================
 * REGISTER
 * =====================================
 */
const register = catchAsync(async (req, res) => {
  let { email, password } = req.body;

  email = String(email || "")
    .trim()
    .toLowerCase();

  const result = await authService.registerUser(email, password);

  const { user, accessToken, refreshToken } = result;

  setTokensInCookies(res, accessToken, refreshToken);

  return apiResponse(
    res,
    201,
    true,
    {
      user,
      accessToken, // Added for Postman / PowerShell testing
    },
    "User registered successfully",
  );
});

/**
 * =====================================
 * LOGIN
 * =====================================
 */
const login = catchAsync(async (req, res) => {
  let { email, password } = req.body;

  email = String(email || "")
    .trim()
    .toLowerCase();

  const result = await authService.loginUser(email, password);

  const { user, accessToken, refreshToken } = result;

  setTokensInCookies(res, accessToken, refreshToken);

  return apiResponse(
    res,
    200,
    true,
    {
      user,
      accessToken, // Added for testing
    },
    "Login successful",
  );
});

/**
 * =====================================
 * REFRESH TOKEN
 * =====================================
 */
const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;

  const result = await authService.refreshAuthToken(token);

  setTokensInCookies(res, result.accessToken, result.refreshToken);

  return apiResponse(
    res,
    200,
    true,
    {
      accessToken: result.accessToken,
    },
    "Token refreshed",
  );
});

/**
 * =====================================
 * LOGOUT
 * =====================================
 */
const logout = catchAsync(async (req, res) => {
  if (req.user?.id) {
    await authService.logoutUser(req.user.id);
  }

  clearTokens(res);

  return apiResponse(res, 200, true, {}, "Logged out successfully");
});

/**
 * =====================================
 * CURRENT USER
 * =====================================
 */
const getMe = catchAsync(async (req, res) => {
  return apiResponse(
    res,
    200,
    true,
    {
      user: req.user,
    },
    "Current user",
  );
});

/**
 * =====================================
 * API KEY
 * =====================================
 */
const getApiKey = catchAsync(async (req, res) => {
  const apiKey = await authService.getUserApiKey(req.user.id);

  return apiResponse(res, 200, true, { apiKey }, "API key fetched");
});

const regenerateApiKey = catchAsync(async (req, res) => {
  const apiKey = await authService.regenerateApiKey(req.user.id);

  return apiResponse(res, 200, true, { apiKey }, "API key regenerated");
});

export default {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  getApiKey,
  regenerateApiKey,
};
