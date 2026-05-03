import authService from "../services/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";



const setTokensInCookies = (res, accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    throw new Error("Missing authentication tokens");
  }

  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // must be true in production (HTTPS)
    sameSite: isProduction ? "none" : "lax",
    path: "/", // 🔥 ensures cookie is sent on all routes
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
// ================= CONTROLLERS =================

// ✅ REGISTER
const register = catchAsync(async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return apiResponse(res, 400, false, null, "Username and password required");
  }

  const user = await authService.registerUser(username, password, role);

  return apiResponse(res, 201, true, { user }, "User registered successfully");
});

// ✅ LOGIN (🔥 FIXED PROPERLY)
const login = catchAsync(async (req, res) => {
  const { email, username, password } = req.body;

  const loginField = username || email;

  // 🔒 Strict validation
  if (!loginField || typeof loginField !== "string" || !password) {
    return apiResponse(res, 400, false, null, "Valid credentials required");
  }

  let result;
  try {
    result = await authService.loginUser(loginField, password);
  } catch (error) {
    // 🔥 Production Logic: If it's a 401 (Invalid Credentials), return normalized response
    if (error.status === 401) {
      return apiResponse(res, 401, false, null, "Invalid credentials");
    }
    
    // For other errors (DB connection, code issues), pass to global handler for 500 response
    throw error;
  }

  if (!result || !result.user) {
    return apiResponse(res, 401, false, null, "Invalid credentials");
  }

  const { user, accessToken, refreshToken } = result;

  // 🔥 Ensure tokens exist before setting cookies
  if (!accessToken || !refreshToken) {
    return apiResponse(res, 500, false, null, "Authentication failed");
  }

  setTokensInCookies(res, accessToken, refreshToken);

  return apiResponse(
    res,
    200,
    true,
    { user },
    "Login successful"
  );
});

// ✅ REFRESH TOKEN
const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return apiResponse(res, 401, false, null, "No refresh token");
  }

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAuthToken(token);

  setTokensInCookies(res, accessToken, newRefreshToken);

  return apiResponse(res, 200, true, {}, "Token refreshed");
});

// ✅ LOGOUT
const logout = catchAsync(async (req, res) => {
  if (req.user?.id) {
    await authService.logoutUser(req.user.id);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return apiResponse(res, 200, true, {}, "Logged out");
});

// ✅ GET CURRENT USER
const getMe = catchAsync(async (req, res) => {
  if (!req.user) {
    return apiResponse(res, 401, false, null, "Not authenticated");
  }

  return apiResponse(res, 200, true, { user: req.user }, "Current user");
});

export default {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};