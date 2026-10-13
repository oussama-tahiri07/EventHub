const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createEventSchema,
  updateEventSchema,
  updateEventStatusSchema,
  queryEventsSchema,
} = require('../schemas/eventSchema');

router.use(authenticateToken);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, location, eventDate, maxParticipants]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *               eventDate: { type: string, format: date-time }
 *               maxParticipants: { type: integer }
 *               status: { type: string, enum: [draft, published, cancelled] }
 *     responses:
 *       201:
 *         description: Event created
 */
router.post(
  '/',
  requireRole('admin', 'staff'),
  validate(createEventSchema),
  eventController.createEvent
);

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get list of events with filters
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [draft, published, cancelled] }
 *       - in: query
 *         name: date
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/', validate(queryEventsSchema, 'query'), eventController.getEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get single event details with registered participants
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
router.get('/:id', eventController.getEventById);

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  requireRole('admin', 'staff'),
  validate(updateEventSchema),
  eventController.updateEvent
);

/**
 * @swagger
 * /api/events/{id}/status:
 *   patch:
 *     summary: Change event status (draft -> published -> cancelled)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/status',
  requireRole('admin', 'staff'),
  validate(updateEventStatusSchema),
  eventController.updateEventStatus
);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', requireRole('admin'), eventController.deleteEvent);

module.exports = router;
