const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET || 'secret';

function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ message: 'Authorization header missing' });

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer')
    return res.status(401).json({ message: 'Invalid authorization format' });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, secret);
    req.user = { id: payload.id, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
