/**
 * Centralized Application Error Handler
 * Standardizes API error responses with clear HTTP status codes.
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    message: `Ressource non trouvée : ${req.method} ${req.originalUrl}`,
  });
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error('[Error Details]', err);

  // PostgreSQL Unique Constraint Violation (23505)
  if (err.code === '23505') {
    return res.status(409).json({
      status: 'error',
      statusCode: 409,
      message: 'Conflit : cette ressource ou inscription existe déjà',
      detail: err.detail,
    });
  }

  // PostgreSQL Foreign Key Violation (23503)
  if (err.code === '23503') {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Référence invalide (entité parente introuvable)',
      detail: err.detail,
    });
  }

  // PostgreSQL Invalid Input Syntax / UUID format (22P02)
  if (err.code === '22P02') {
    return res.status(400).json({
      status: 'error',
      statusCode: 400,
      message: 'Format d identifiant ou donnée invalide',
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Erreur interne du serveur';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(err.details && { details: err.details }),
  });
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
};
