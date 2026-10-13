const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createParticipantSchema,
  updateParticipantSchema,
  queryParticipantsSchema,
} = require('../schemas/participantSchema');

router.use(authenticateToken);

/**
 * @swagger
 * /api/participants:
 *   post:
 *     summary: Create participant
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  validate(createParticipantSchema),
  participantController.createParticipant
);

/**
 * @swagger
 * /api/participants:
 *   get:
 *     summary: List participants with search filter
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  validate(queryParticipantsSchema, 'query'),
  participantController.getParticipants
);

/**
 * @swagger
 * /api/participants/{id}:
 *   get:
 *     summary: Get participant by ID with event history
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', participantController.getParticipantById);

/**
 * @swagger
 * /api/participants/{id}:
 *   put:
 *     summary: Update participant
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  validate(updateParticipantSchema),
  participantController.updateParticipant
);

/**
 * @swagger
 * /api/participants/{id}:
 *   delete:
 *     summary: Delete participant
 *     tags: [Participants]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireRole('admin'), participantController.deleteParticipant);

module.exports = router;
