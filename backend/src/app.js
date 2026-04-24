const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const scanRoutes = require('./routes/scans');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // allow Postman, server-to-server, curl, health checks
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    console.log("Blocked by CORS:", origin);
    return cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

// Global rate limit — tighter limits applied per-route where needed
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static uploads (dev only — use CDN/S3 in prod) ───────────────────────────
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/scans', scanRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Error handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
