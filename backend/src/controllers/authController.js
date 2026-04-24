const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, queryOne } = require('../db');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
async function register(req, res) {
  const { email, password, name } = req.body;

  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING id, email, name, role, created_at`,
    [email.toLowerCase(), passwordHash, name]
  );

  res.status(201).json({ token: signToken(user), user });
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;

  const user = await queryOne(
    'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
    [email.toLowerCase()]
  );
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const { password_hash, ...safeUser } = user;
  res.json({ token: signToken(safeUser), user: safeUser });
}

// GET /api/auth/me
async function me(req, res) {
  const user = await queryOne(
    'SELECT id, email, name, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}

module.exports = { register, login, me };
