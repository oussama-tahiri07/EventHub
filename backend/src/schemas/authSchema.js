const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(1, 'Le mot de passe est obligatoire'),
});

module.exports = {
  loginSchema,
};
