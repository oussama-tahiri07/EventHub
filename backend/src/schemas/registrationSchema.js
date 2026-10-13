const { z } = require('zod');

const createRegistrationSchema = z.object({
  eventId: z.string().uuid('ID événement invalide (UUID requis)'),
  participantId: z.string().uuid('ID participant invalide (UUID requis)'),
  status: z.enum(['pending', 'confirmed', 'waitlist']).optional().default('confirmed'),
});

const updateRegistrationStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'waitlist'], {
    errorMap: () => ({ message: "Le statut doit être 'pending', 'confirmed', 'cancelled' ou 'waitlist'" }),
  }),
});

const queryRegistrationsSchema = z.object({
  eventId: z.string().uuid().optional(),
  participantId: z.string().uuid().optional(),
  status: z.enum(['pending', 'confirmed', 'cancelled', 'waitlist']).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(20),
});

module.exports = {
  createRegistrationSchema,
  updateRegistrationStatusSchema,
  queryRegistrationsSchema,
};
