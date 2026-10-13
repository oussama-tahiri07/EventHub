const { z } = require('zod');

const createEventSchema = z.object({
  title: z.string().min(3, 'Le titre doit comporter au moins 3 caractères').max(200),
  description: z.string().min(5, 'La description doit comporter au moins 5 caractères'),
  location: z.string().min(2, 'Le lieu doit comporter au moins 2 caractères'),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Format de date invalide (ISO attendu)',
  }),
  maxParticipants: z.coerce.number().int().positive('Le nombre maximum de participants doit être supérieur à 0'),
  status: z.enum(['draft', 'published', 'cancelled']).optional().default('draft'),
});

const updateEventSchema = createEventSchema.partial();

const updateEventStatusSchema = z.object({
  status: z.enum(['draft', 'published', 'cancelled'], {
    errorMap: () => ({ message: "Le statut doit être 'draft', 'published' ou 'cancelled'" }),
  }),
});

const queryEventsSchema = z.object({
  status: z.enum(['draft', 'published', 'cancelled']).optional(),
  date: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  updateEventStatusSchema,
  queryEventsSchema,
};
