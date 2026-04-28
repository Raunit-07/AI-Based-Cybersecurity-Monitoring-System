const { body } = require('express-validator');

const logValidator = [
  body('sourceIp').isIP().withMessage('Valid Source IP is required'),
  body('method').notEmpty().withMessage('HTTP Method is required'),
  body('endpoint').notEmpty().withMessage('Endpoint is required'),
  body('userAgent').optional().isString(),
  body('payload').optional()
];

module.exports = { logValidator };
