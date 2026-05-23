/**
 * CSRF Protection Middleware
 * Enforces Origin/Referer matching on state-changing cookie-authenticated requests.
 */

export const csrfProtection = (req, res, next) => {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // If request has no auth cookies, CSRF checks are skipped (e.g. API keys or Authorization header JWTs)
  const hasAuthCookies = req.cookies && (req.cookies.accessToken || req.cookies.refreshToken);
  if (!hasAuthCookies) {
    return next();
  }

  // Enforce origin/referer matching
  const origin = req.headers.origin || req.headers.referer;
  if (!origin) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "CSRF check failed: Missing Origin or Referer header"
    });
  }

  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const isAllowed = allowedOrigins.some((allowed) => origin.startsWith(allowed));
  if (!isAllowed) {
    return res.status(403).json({
      success: false,
      data: null,
      message: `CSRF check failed: Origin ${origin} is not allowed`
    });
  }

  next();
};

export default csrfProtection;
