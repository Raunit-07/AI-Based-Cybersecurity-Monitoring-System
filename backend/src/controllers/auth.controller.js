import authService from "../services/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

/**
 * ================= COOKIE CONFIG =================
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
 * ================= SET TOKENS =================
 */
const setTokensInCookies = (res, accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    const error = new Error("Missing authentication tokens");
    error.status = 500;
    throw error;
  }

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
 * ================= CLEAR TOKENS =================
 */
const clearTokens = (res) => {
  const cookieOptions = getCookieOptions();

  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

/**
 * ================= REGISTER =================
 */
const register = catchAsync(async (req, res) => {
  let { email, password } = req.body;

  email = String(email || "").trim().toLowerCase();

  if (!email || !password) {
    return apiResponse(
      res,
      400,
      false,
      null,
      "Email and password are required"
    );
  }

  const result = await authService.registerUser(email, password);

  const { user, accessToken, refreshToken } = result;

  setTokensInCookies(res, accessToken, refreshToken);

  return apiResponse(
    res,
    201,
    true,
    { user },
    "User registered successfully"
  );
});

/**
 * ================= LOGIN =================
 */
const login = catchAsync(async (req, res) => {
  let { email, password } = req.body;

  email = String(email || "").trim().toLowerCase();

  if (!email || !password) {
    return apiResponse(
      res,
      400,
      false,
      null,
      "Email and password required"
    );
  }

  const result = await authService.loginUser(email, password);

  const { user, accessToken, refreshToken } = result;

  setTokensInCookies(res, accessToken, refreshToken);

  return apiResponse(res, 200, true, { user }, "Login successful");
});

/**
 * ================= REFRESH TOKEN =================
 */
const refreshToken = catchAsync(async (req, res) => {
  const existingRefreshToken = req.cookies?.refreshToken;

  if (!existingRefreshToken) {
    return apiResponse(res, 401, false, null, "Refresh token missing");
  }

  const tokens = await authService.refreshAuthToken(existingRefreshToken);

  if (!tokens?.accessToken || !tokens?.refreshToken) {
    return apiResponse(res, 401, false, null, "Invalid refresh token");
  }

  setTokensInCookies(res, tokens.accessToken, tokens.refreshToken);

  return apiResponse(res, 200, true, {}, "Token refreshed successfully");
});

/**
 * ================= LOGOUT =================
 */
const logout = catchAsync(async (req, res) => {
  if (req.user?.id) {
    await authService.logoutUser(req.user.id);
  }

  clearTokens(res);

  return apiResponse(res, 200, true, {}, "Logged out successfully");
});

/**
 * ================= CURRENT USER =================
 */
const getMe = catchAsync(async (req, res) => {
  if (!req.user) {
    return apiResponse(res, 401, false, null, "Unauthorized");
  }

  return apiResponse(
    res,
    200,
    true,
    { user: req.user },
    "Current user fetched successfully"
  );
});

export default {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};