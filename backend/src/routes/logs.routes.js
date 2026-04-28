const express = require('express');
const router = express.Router();
const logsController = require('../controllers/logs.controller');
const { logValidator } = require('../validators/log.validator');
const validate = require('../middlewares/validate.middleware');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.post('/', logValidator, validate, logsController.ingestLog);
router.get('/', authMiddleware, logsController.getLogs);

module.exports = router;
