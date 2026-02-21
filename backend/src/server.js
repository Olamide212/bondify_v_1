require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const discoverRoutes = require('./routes/discoverRoutes');
const matchRoutes = require('./routes/matchRoutes');
const messageRoutes = require('./routes/messageRoutes');
const lookupRoutes = require('./routes/lookupRoutes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting for auth routes (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

// Rate limiting for API routes (more permissive)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Allow 500 requests per 15 minutes for general API
  message: 'Too many requests from this IP, please try again later.',
});

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/lookup', lookupRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Accept connections from any IP

app.listen(PORT, HOST, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   Bondies API Server                  ║
  ║   Host: ${HOST.padEnd(30)}║
  ║   Port: ${String(PORT).padEnd(28)}║
  ║   Environment: ${String(process.env.NODE_ENV || 'development').padEnd(15)}║
  ║   Status: Running ✓                   ║
  ╚═══════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;
