// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// ✅ Load environment variables
dotenv.config();

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Enable CORS for local dev and deployed frontend
const allowedOrigins = [
  'http://localhost:3000',      // React dev server
  'https://pabett.netlify.app'  // Deployed frontend
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ✅ Serve static folder for gallery images
app.use('/uploads/gallery', express.static(path.join(__dirname, 'uploads/gallery')));

// ✅ Routes
app.use('/api/booking', require('./routes/booking'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/admin', require('./routes/admin'));

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.send('🌐 PABETT Booking & Gallery Backend is Live!');
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ error: 'Server Error', message: err.message });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));

  // All unmatched routes go to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
