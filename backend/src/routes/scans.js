const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const requireAuth = require('../middleware/auth');
const {
  getScan,
  uploadScan,
  deleteScan,
  chatWithScans,
} = require('../controllers/scansController');

// Multer — store PDFs in /uploads, reject non-PDF files
const storage = multer.diskStorage({
  destination: process.env.UPLOAD_DIR || './uploads',
  filename: (_req, file, cb) => {
    const ts = Date.now();
    cb(null, `${ts}-${file.originalname.replace(/\s+/g, '_')}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 20) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') return cb(null, true);
    cb(new Error('Only PDF files are accepted'));
  },
});

// POST /api/scans/chat — public: MemberGPT (no auth per spec)
// Must be declared BEFORE /:id to avoid Express matching 'chat' as an id param
router.post('/chat', chatWithScans);

// POST /api/scans/upload — requires auth
router.post('/upload', requireAuth, upload.single('pdf'), uploadScan);

// GET  /api/scans/:id — requires auth
router.get('/:id', requireAuth, getScan);

// DELETE /api/scans/:id — requires auth
router.delete('/:id', requireAuth, deleteScan);

module.exports = router;