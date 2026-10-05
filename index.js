import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.log('DNS setServers notice:', e.message);
}
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import reportRoutes from './routes/reports.js';
import vitalRoutes from './routes/vitals.js';
import assistantRoutes from './routes/assistant.js';

dotenv.config();

connectDB();



const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS Configuration using Environment Variables
const getOrigin = (urlStr) => {
  if (!urlStr) return null;
  try {
    return new URL(urlStr).origin;
  } catch (e) {
    return urlStr.replace(/\/$/, '');
  }
};

const allowedOrigins = [
  process.env.FRONTEND_URL,
  getOrigin(process.env.FRONTEND_URL),
  process.env.CLIENT_URL,
  getOrigin(process.env.CLIENT_URL),
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/vitals', vitalRoutes);
app.use('/api/assistant', assistantRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'HealthMate API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  process.exit(1);
});
