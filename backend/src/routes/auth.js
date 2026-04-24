const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const validate = require('../middleware/validate');
const { register, login, me } = require('../controllers/authController');
const requireAuth = require('../middleware/auth');

// Tight rate limit on auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).max(100),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', requireAuth, me);

module.exports = router;
