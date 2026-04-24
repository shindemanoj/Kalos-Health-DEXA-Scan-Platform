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

router.use(requireAuth);

// GET  /api/scans/:id        — single scan detail
router.get('/:id', getScan);

// POST /api/scans/upload     — upload PDF, parse, save
router.post('/upload', upload.single('pdf'), uploadScan);

// DELETE /api/scans/:id      — remove a scan
router.delete('/:id', deleteScan);

// POST /api/scans/chat       — MemberGPT: natural language query
router.post('/chat', chatWithScans);

module.exports = router;
