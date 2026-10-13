const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'eventhub_super_secret_jwt_key_2026_modern_token';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      statusCode: 401,
      message: 'Accès non autorisé : jeton d authentification manquant',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        message: 'Accès refusé : jeton invalide ou expiré',
      });
    }

    req.user = user;
    next();
  });
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'Accès non autorisé',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        statusCode: 403,
        message: `Action réservée aux rôles : ${roles.join(', ')}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
};
