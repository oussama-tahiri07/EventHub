const { z } = require('zod');

const createParticipantSchema = z.object({
  fullName: z.string().min(2, 'Le nom complet doit comporter au moins 2 caractères').max(150),
  email: z.string().email('Format email invalide').max(255),
  phone: z.string().max(50).optional().nullable(),
});

const updateParticipantSchema = createParticipantSchema.partial();

const queryParticipantsSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

module.exports = {
  createParticipantSchema,
  updateParticipantSchema,
  queryParticipantsSchema,
};
