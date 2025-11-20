const mongoose = require('mongoose');

const galleryImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  altText: { type: String, default: '' },
  caption: { type: String, default: '' },
  section: { type: String, default: 'Other' },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Check if model already exists, else create it
module.exports = mongoose.models.GalleryImage || mongoose.model('GalleryImage', galleryImageSchema);
