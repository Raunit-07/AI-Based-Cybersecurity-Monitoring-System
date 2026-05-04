import authService from "../services/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

/**
 * Cookie Configuration
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
 * Set Access + Refresh Tokens
 */
const setTokensInCookies = (res, accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    throw new Error("Missing authentication tokens");
  }

  const cookieOptions = getCookieOptions();

  // Access Token
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000, // 15 min
  });

  // Refresh Token
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

/**
 * Clear Tokens
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
  const { username, password, role } = req.body;

  if (!username || !password) {
    return apiResponse(
      res,
      400,
      false,
      null,
      "Username and password are required"
    );
  }

  const user = await authService.registerUser(username, password, role);

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
  const { email, username, password } = req.body;

  const loginField = username || email;

  if (!loginField || typeof loginField !== "string" || !password) {
    return apiResponse(
      res,
      400,
      false,
      null,
      "Valid login credentials required"
    );
  }

  let result;

  try {
    result = await authService.loginUser(loginField, password);
  } catch (error) {
    if (error.status === 401) {
      return apiResponse(res, 401, false, null, "Invalid credentials");
    }

    throw error;
  }

  if (!result?.user || !result?.accessToken || !result?.refreshToken) {
    return apiResponse(
      res,
      500,
      false,
      null,
      "Authentication failed"
    );
  }

  const { user, accessToken, refreshToken } = result;

  setTokensInCookies(res, accessToken, refreshToken);

  return apiResponse(
    res,
    200,
    true,
    { user },
    "Login successful"
  );
});

/**
 * ================= REFRESH TOKEN =================
 */
const refreshToken = catchAsync(async (req, res) => {
  const existingRefreshToken = req.cookies?.refreshToken;

  if (!existingRefreshToken) {
    return apiResponse(
      res,
      401,
      false,
      null,
      "Refresh token missing"
    );
  }

  const tokens = await authService.refreshAuthToken(
    existingRefreshToken
  );

  if (!tokens?.accessToken || !tokens?.refreshToken) {
    return apiResponse(
      res,
      401,
      false,
      null,
      "Invalid refresh token"
    );
  }

  setTokensInCookies(
    res,
    tokens.accessToken,
    tokens.refreshToken
  );

  return apiResponse(
    res,
    200,
    true,
    {},
    "Token refreshed successfully"
  );
});

/**
 * ================= LOGOUT =================
 */
const logout = catchAsync(async (req, res) => {
  if (req.user?.id) {
    await authService.logoutUser(req.user.id);
  }

  clearTokens(res);

  return apiResponse(
    res,
    200,
    true,
    {},
    "Logged out successfully"
  );
});

/**
 * ================= CURRENT USER =================
 */
const getMe = catchAsync(async (req, res) => {
  if (!req.user) {
    return apiResponse(
      res,
      401,
      false,
      null,
      "Not authenticated"
    );
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
