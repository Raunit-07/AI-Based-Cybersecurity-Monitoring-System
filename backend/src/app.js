const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const { globalLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/error.middleware');

const authRoutes = require('./routes/auth.routes');
const logsRoutes = require('./routes/logs.routes');
const alertsRoutes = require('./routes/alerts.routes');

const authController = require('./controllers/auth.controller');
const alertsController = require('./controllers/alerts.controller');
const { authMiddleware } = require('./middlewares/auth.middleware');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
// app.use(xss());

// Body Parsing & Cookies
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Rate Limiting (Global)
app.use('/api', globalLimiter);

// Standard API Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/alerts', alertsRoutes);

// Legacy/Compatibility Routes (To ensure frontend doesn't break)
app.post('/api/login', authRoutes); // This mounts auth routes on /api/login, wait, better route it specifically
app.post('/api/login', (req, res, next) => {
  req.url = '/login'; // rewrite
  authRoutes(req, res, next);
});

app.get('/api/alerts', authMiddleware, alertsController.getAlertsLegacy);

// Mock IPs route for compatibility
app.get('/api/ips', authMiddleware, (req, res) => {
  res.json([
    { ip: '192.168.1.105', score: 98, location: 'Russia', lastSeen: new Date().toISOString() },
    { ip: '10.0.0.52', score: 85, location: 'China', lastSeen: new Date().toISOString() },
    { ip: '172.16.0.11', score: 65, location: 'Brazil', lastSeen: new Date().toISOString() },
    { ip: '45.22.11.9', score: 92, location: 'North Korea', lastSeen: new Date().toISOString() },
  ]);
});

// Unknown Routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
