require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { pool, testConnection } = require('./config/db');
const { initSocket } = require('./utils/socketManager');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const adminRoutes = require('./routes/adminRoutes');
const waitlistRoutes = require('./routes/waitlistRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const { releaseExpiredNoShows } = require('./services/bookingService');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      status: 'HEALTHY',
      database: process.env.DB_NAME || 'slotsync_db',
      realtime: 'Socket.io Active',
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, status: 'DB_ERROR', error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/recommendations', recommendationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

cron.schedule('* * * * *', async () => {
  try {
    await releaseExpiredNoShows();
  } catch (err) {
    console.error('❌ No-Show Cron Error:', err.message);
  }
});

const startServer = async () => {
  await testConnection();
  console.log('⏱️ Automated 15-minute No-Show Release Cron Job scheduled (every 1 min).');

  const server = http.createServer(app);
  initSocket(server, allowedOrigins);

  server.listen(PORT, () => {
    console.log(`🚀 SlotSync Backend + WebSockets running on http://localhost:${PORT}`);
  });
};

startServer();