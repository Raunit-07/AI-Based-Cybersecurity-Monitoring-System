const { validationResult } = require('express-validator');
const apiResponse = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => err.msg).join(', ');
    return apiResponse(res, 400, false, {}, `Validation Error: ${errorMsg}`);
  }
  next();
};

module.exports = validate;
