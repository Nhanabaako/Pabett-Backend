const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  phone: String,
  service1: String,
  service2: String,
  occasion: String,
  date: String,
  time: String,
  location: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema);
