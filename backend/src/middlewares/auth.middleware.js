const jwt = require('jsonwebtoken');
const apiResponse = require('../utils/apiResponse');

const authMiddleware = (req, res, next) => {
  let token;
  
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return apiResponse(res, 401, false, {}, 'Not authorized to access this route');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    return apiResponse(res, 401, false, {}, 'Token is invalid or expired');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return apiResponse(res, 403, false, {}, 'User role is not authorized to access this route');
    }
    next();
  };
};

module.exports = { authMiddleware, authorize };
