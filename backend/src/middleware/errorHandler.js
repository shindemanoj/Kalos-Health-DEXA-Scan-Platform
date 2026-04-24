module.exports = function errorHandler(err, req, res, _next) {
  const isDev = process.env.NODE_ENV !== 'production';

  // Validation errors (Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      issues: err.errors.map(e => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  // CORS
  if (err.message?.startsWith('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  // JWT errors surfaced outside middleware
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  res.status(err.status || 500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};
