const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// POST /api/upload
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    res.json({
      url: req.file.path,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      publicId: req.file.filename,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload failed' });
  }
});

module.exports = router;
