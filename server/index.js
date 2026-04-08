const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');
const cookieParser = require('cookie-parser');

// Fix potential Node.js IPv6 ECONNRESET issues with TMDB
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
app.use(cors({ 
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true 
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movie'));
app.use('/api/users', require('./routes/user'));
app.use('/api/connections', require('./routes/connection'));
app.use('/api/discussions', require('./routes/discussion'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/collections', require('./routes/collection'));
app.use('/api/hypes', require('./routes/hype'));

// Global error handler to capture explicitly why "Update failed"
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  require('fs').appendFileSync('error.log', new Date().toISOString() + ' ' + (err.stack || err.message) + '\n');
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
