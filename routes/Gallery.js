// routes/gallery.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GalleryImage = require('../models/GalleryImage');
const router = express.Router();
const protect = require('../middleware/auth');


// 🔐 simple admin protection using header key
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ error: 'Forbidden: Admins only' });
  }
  next();
};



// --- Multer setup ---
const uploadDir = path.join(__dirname, '..', 'uploads', 'gallery');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// --- Get images ---
router.get('/', async (req, res) => {
  try {
    const images = await GalleryImage.find().sort({ createdAt: -1 }).lean();
    res.json({ images });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching gallery' });
  }
});

// --- Upload new image (Admin only) ---
router.post('/upload', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { altText = '', caption = '' } = req.body;
    const newImage = new GalleryImage({
      url: `/uploads/gallery/${req.file.filename}`,
      altText,
      caption,
    });
    await newImage.save();
    res.status(201).json({ message: 'Image uploaded', image: newImage });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed', detail: err.message });
  }
});



// --- Delete image (Admin only) ---
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) return res.status(404).json({ error: 'Image not found' });

    // delete file on disk if exists
    const filePath = path.join(__dirname, '..', image.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await image.deleteOne();
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting image', detail: err.message });
  }
});

module.exports = router;
