/**
 * HTTPS Enforcer Middleware
 * Redirects HTTP traffic to HTTPS when running in production.
 */

export const enforceHttps = (req, res, next) => {
  const host = req.headers.host || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https" &&
    !isLocalhost
  ) {
    return res.redirect(301, `https://${host}${req.url}`);
  }
  next();
};

export default enforceHttps;
