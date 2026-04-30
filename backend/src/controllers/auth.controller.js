import authService from "../services/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import apiResponse from "../utils/apiResponse.js";

// ================= COOKIE HANDLER =================
const setTokensInCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ================= CONTROLLERS =================
const register = catchAsync(async (req, res) => {
  const { username, password, role } = req.body;

  const user = await authService.registerUser(username, password, role);

  return apiResponse(res, 201, true, { user }, "User registered successfully");
});

const login = catchAsync(async (req, res) => {
  const { username, password } = req.body;

  const { user, accessToken, refreshToken } =
    await authService.loginUser(username, password);

  setTokensInCookies(res, accessToken, refreshToken);

  return apiResponse(
    res,
    200,
    true,
    { user, token: accessToken },
    "Login successful"
  );
});

const refreshToken = catchAsync(async (req, res) => {
  const token = req.cookies.refreshToken;

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAuthToken(token);

  setTokensInCookies(res, accessToken, newRefreshToken);

  return apiResponse(
    res,
    200,
    true,
    { token: accessToken },
    "Token refreshed"
  );
});

const logout = catchAsync(async (req, res) => {
  if (req.user?.id) {
    await authService.logoutUser(req.user.id);
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return apiResponse(res, 200, true, {}, "Logged out");
});

const getMe = catchAsync(async (req, res) => {
  if (!req.user) {
    return apiResponse(res, 401, false, null, "Not authenticated");
  }

  return apiResponse(res, 200, true, { user: req.user }, "Current user");
});

// ✅ EXPORT DEFAULT (IMPORTANT)
export default {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};