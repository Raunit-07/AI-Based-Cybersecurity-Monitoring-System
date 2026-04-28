const express = require('express');
const router = express.Router();
const alertsController = require('../controllers/alerts.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, alertsController.getAlerts);

module.exports = router;
