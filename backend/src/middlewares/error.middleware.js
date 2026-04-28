const logger = require('../utils/logger');
const apiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific MongoDB or parsing errors here
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }

  // Log the error
  if (statusCode === 500) {
    logger.error(`[${req.method} ${req.url}] ${err.stack}`);
  } else {
    logger.warn(`[${req.method} ${req.url}] ${message}`);
  }

  // Don't leak stack trace in production
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    success: false,
    data: {},
    message: isProduction && statusCode === 500 ? 'Internal Server Error' : message,
    ...( !isProduction && { stack: err.stack } )
  });
};

module.exports = errorHandler;
