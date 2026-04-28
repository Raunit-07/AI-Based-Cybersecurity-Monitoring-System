const apiResponse = (res, statusCode, success, data, message = '') => {
  res.status(statusCode).json({
    success,
    data,
    message
  });
};

module.exports = apiResponse;
