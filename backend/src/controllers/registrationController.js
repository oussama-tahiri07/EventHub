const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/registrations
 * Register a participant to an event
 * Enforces business rules:
 * 1. Event MUST be published
 * 2. Participant CANNOT register twice for same event
 * 3. Cannot exceed maxParticipants
 */
const createRegistration = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { eventId, participantId, status = 'confirmed' } = req.body;

    await client.query('BEGIN');

    // 1. Verify Event existence and lock row for atomic capacity check
    const eventResult = await client.query(
      'SELECT id, title, max_participants, status FROM events WHERE id = $1 FOR UPDATE',
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError('Événement introuvable', 404);
    }

    const event = eventResult.rows[0];

    // Mandatory Business Rule: Impossible d'inscrire un participant sur un événement non publié
    if (event.status !== 'published') {
      throw new AppError(
        `Inscription impossible : l'événement "${event.title}" n'est pas publié (statut actuel : ${event.status})`,
        400
      );
    }

    // 2. Verify Participant existence
    const participantResult = await client.query(
      'SELECT id, full_name, email FROM participants WHERE id = $1',
      [participantId]
    );

    if (participantResult.rows.length === 0) {
      throw new AppError('Participant introuvable', 404);
    }

    // 3. Mandatory Business Rule: Un participant ne peut pas s'inscrire 2 fois au même événement
    const existingRegistration = await client.query(
      'SELECT id, status FROM registrations WHERE event_id = $1 AND participant_id = $2',
      [eventId, participantId]
    );

    if (existingRegistration.rows.length > 0) {
      throw new AppError(
        'Ce participant est déjà inscrit à cet événement',
        409,
        { existingRegistration: existingRegistration.rows[0] }
      );
    }

    // 4. Mandatory Business Rule: Ne pas dépasser maxParticipants (si complet -> bloquer inscription sauf waitlist)
    const activeCountResult = await client.query(
      "SELECT COUNT(*)::int AS count FROM registrations WHERE event_id = $1 AND status IN ('confirmed', 'pending')",
      [eventId]
    );

    const activeCount = activeCountResult.rows[0].count;
    if (activeCount >= event.max_participants && status !== 'waitlist') {
      throw new AppError(
        `Inscription impossible : la capacité maximale (${event.max_participants} participants) est atteinte. Vous pouvez vous inscrire sur liste d'attente.`,
        400,
        { currentRegistrations: activeCount, maxParticipants: event.max_participants, canWaitlist: true }
      );
    }

    // Insert Registration
    const insertResult = await client.query(
      `INSERT INTO registrations (event_id, participant_id, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [eventId, participantId, status]
    );

    await client.query('COMMIT');

    // Fetch complete response with relations
    const completeRegistration = await db.query(
      `SELECT 
        r.id,
        r.status,
        r.created_at,
        r.updated_at,
        e.id AS event_id,
        e.title AS event_title,
        e.event_date,
        e.max_participants,
        p.id AS participant_id,
        p.full_name AS participant_name,
        p.email AS participant_email
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       JOIN participants p ON r.participant_id = p.id
       WHERE r.id = $1`,
      [insertResult.rows[0].id]
    );

    res.status(201).json({
      status: 'success',
      data: {
        registration: completeRegistration.rows[0],
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * GET /api/registrations?eventId=&participantId=&status=&page=&limit=
 * List registrations with filters
 */
const getRegistrations = async (req, res, next) => {
  try {
    const { eventId, participantId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (eventId) {
      params.push(eventId);
      conditions.push(`r.event_id = $${params.length}`);
    }

    if (participantId) {
      params.push(participantId);
      conditions.push(`r.participant_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM registrations r ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const query = `
      SELECT 
        r.id,
        r.status,
        r.created_at,
        r.updated_at,
        e.id AS event_id,
        e.title AS event_title,
        e.location AS event_location,
        e.event_date,
        e.status AS event_status,
        e.max_participants,
        p.id AS participant_id,
        p.full_name AS participant_name,
        p.email AS participant_email,
        p.phone AS participant_phone
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN participants p ON r.participant_id = p.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const result = await db.query(query, [...params, limit, offset]);

    res.status(200).json({
      status: 'success',
      data: {
        registrations: result.rows,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/registrations/:id/status
 * Update registration status (pending, confirmed, cancelled)
 */
const updateRegistrationStatus = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;

    await client.query('BEGIN');

    const regResult = await client.query(
      'SELECT r.*, e.max_participants, e.status AS event_status FROM registrations r JOIN events e ON r.event_id = e.id WHERE r.id = $1 FOR UPDATE',
      [id]
    );

    if (regResult.rows.length === 0) {
      throw new AppError('Inscription introuvable', 404);
    }

    const reg = regResult.rows[0];

    // If reopening a cancelled registration or promoting from waitlist, check capacity
    if (['cancelled', 'waitlist'].includes(reg.status) && ['confirmed', 'pending'].includes(status)) {
      if (reg.event_status !== 'published') {
        throw new AppError("Impossible d'activer une inscription sur un événement non publié", 400);
      }

      const activeCountResult = await client.query(
        "SELECT COUNT(*)::int AS count FROM registrations WHERE event_id = $1 AND status IN ('confirmed', 'pending')",
        [reg.event_id]
      );
      if (activeCountResult.rows[0].count >= reg.max_participants) {
        throw new AppError("Capacité maximale de l'événement atteinte. Impossible de confirmer cette inscription.", 400);
      }
    }

    const updateResult = await client.query(
      `UPDATE registrations
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    await client.query('COMMIT');

    res.status(200).json({
      status: 'success',
      data: {
        registration: updateResult.rows[0],
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

/**
 * DELETE /api/registrations/:id
 */
const deleteRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM registrations WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new AppError('Inscription introuvable', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Inscription supprimée avec succès',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRegistration,
  getRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
};
