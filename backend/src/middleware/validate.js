const { ZodError } = require('zod');

/**
 * Validates request data (body, query, or params) against a Zod schema.
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return res.status(400).json({
          status: 'error',
          statusCode: 400,
          message: 'Données de validation invalides',
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
};

module.exports = validate;
