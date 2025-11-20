// routes/admin.js
const express = require('express');
const router = express.Router();

// ✅ POST /api/admin/login
router.post('/login', (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ success: false, message: 'Missing key' });
  }

  if (key === process.env.ADMIN_KEY) {
    return res.json({ success: true, message: 'Login successful' });
  }

  return res.status(403).json({ success: false, message: 'Invalid key' });
});

module.exports = router;
