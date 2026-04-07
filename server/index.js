const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');

// Fix potential Node.js IPv6 ECONNRESET issues with TMDB
dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movie'));
app.use('/api/users', require('./routes/user'));
app.use('/api/connections', require('./routes/connection'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/discussions', require('./routes/discussion'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
