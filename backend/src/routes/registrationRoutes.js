const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticateToken } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createRegistrationSchema,
  updateRegistrationStatusSchema,
  queryRegistrationsSchema,
} = require('../schemas/registrationSchema');

router.use(authenticateToken);

/**
 * @swagger
 * /api/registrations:
 *   post:
 *     summary: Register participant to an event
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  validate(createRegistrationSchema),
  registrationController.createRegistration
);

/**
 * @swagger
 * /api/registrations:
 *   get:
 *     summary: List registrations with event/status filters
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  validate(queryRegistrationsSchema, 'query'),
  registrationController.getRegistrations
);

/**
 * @swagger
 * /api/registrations/{id}/status:
 *   patch:
 *     summary: Change registration status (pending, confirmed, cancelled)
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/status',
  validate(updateRegistrationStatusSchema),
  registrationController.updateRegistrationStatus
);

/**
 * @swagger
 * /api/registrations/{id}:
 *   delete:
 *     summary: Delete registration
 *     tags: [Registrations]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', registrationController.deleteRegistration);

module.exports = router;
