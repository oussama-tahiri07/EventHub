const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/events
 * Create a new event
 */
const createEvent = async (req, res, next) => {
  try {
    const { title, description, location, eventDate, maxParticipants, status } = req.body;
    const createdBy = req.user.id;

    const result = await db.query(
      `INSERT INTO events (title, description, location, event_date, max_participants, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [title, description, location, eventDate, maxParticipants, status || 'draft', createdBy]
    );

    res.status(201).json({
      status: 'success',
      data: {
        event: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/events?status=&date=&page=&limit=
 * List events with filtering and stats
 */
const getEvents = async (req, res, next) => {
  try {
    const { status, date, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`e.status = $${params.length}`);
    }

    if (date) {
      params.push(date);
      conditions.push(`DATE(e.event_date) = DATE($${params.length})`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(e.title ILIKE $${params.length} OR e.location ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Total count query for pagination
    const countResult = await db.query(
      `SELECT COUNT(*) FROM events e ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Main query with registration counts and author name
    const query = `
      SELECT 
        e.*,
        u.name AS creator_name,
        u.email AS creator_email,
        COUNT(r.id) FILTER (WHERE r.status != 'cancelled')::int AS active_registrations_count,
        ROUND((COUNT(r.id) FILTER (WHERE r.status != 'cancelled')::decimal / NULLIF(e.max_participants, 0)) * 100, 1) AS fill_rate
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN registrations r ON e.id = r.event_id
      ${whereClause}
      GROUP BY e.id, u.name, u.email
      ORDER BY e.event_date ASC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const result = await db.query(query, [...params, limit, offset]);

    res.status(200).json({
      status: 'success',
      data: {
        events: result.rows,
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
 * GET /api/events/:id
 * Retrieve event details and its registrations
 */
const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const eventResult = await db.query(
      `SELECT 
        e.*,
        u.name AS creator_name,
        u.email AS creator_email,
        COUNT(r.id) FILTER (WHERE r.status != 'cancelled')::int AS active_registrations_count,
        ROUND((COUNT(r.id) FILTER (WHERE r.status != 'cancelled')::decimal / NULLIF(e.max_participants, 0)) * 100, 1) AS fill_rate
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN registrations r ON e.id = r.event_id
      WHERE e.id = $1
      GROUP BY e.id, u.name, u.email`,
      [id]
    );

    if (eventResult.rows.length === 0) {
      throw new AppError('Événement introuvable', 404);
    }

    // Also fetch registrations with participant info
    const registrationsResult = await db.query(
      `SELECT 
        r.id,
        r.status,
        r.created_at,
        p.id AS participant_id,
        p.full_name,
        p.email,
        p.phone
      FROM registrations r
      JOIN participants p ON r.participant_id = p.id
      WHERE r.event_id = $1
      ORDER BY r.created_at DESC`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        event: eventResult.rows[0],
        registrations: registrationsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/events/:id
 * Update event
 */
const updateEvent = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { title, description, location, eventDate, maxParticipants, status } = req.body;

    await client.query('BEGIN');

    const check = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [id]);
    if (check.rows.length === 0) {
      throw new AppError('Événement introuvable', 404);
    }

    const currentEvent = check.rows[0];

    // Security policy: Seul un administrateur peut annuler un événement
    if (status === 'cancelled' && req.user.role !== 'admin') {
      throw new AppError("Action non autorisée : seul un administrateur peut annuler un événement", 403);
    }

    const result = await client.query(
      `UPDATE events
       SET 
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         location = COALESCE($3, location),
         event_date = COALESCE($4, event_date),
         max_participants = COALESCE($5, max_participants),
         status = COALESCE($6, status),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [title, description, location, eventDate, maxParticipants, status, id]
    );

    const updatedEvent = result.rows[0];

    // Business Rule 4: If event is cancelled, cascade status to all its registrations
    if (status === 'cancelled' && currentEvent.status !== 'cancelled') {
      await client.query(
        `UPDATE registrations 
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE event_id = $1 AND status != 'cancelled'`,
        [id]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      status: 'success',
      data: {
        event: updatedEvent,
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
 * PATCH /api/events/:id/status
 * Update status specifically (e.g. draft -> published, or -> cancelled)
 */
const updateEventStatus = async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;

    await client.query('BEGIN');

    const check = await client.query('SELECT * FROM events WHERE id = $1 FOR UPDATE', [id]);
    if (check.rows.length === 0) {
      throw new AppError('Événement introuvable', 404);
    }

    const currentEvent = check.rows[0];

    // Security policy: Seul un administrateur peut annuler un événement
    if (status === 'cancelled' && req.user.role !== 'admin') {
      throw new AppError("Action non autorisée : seul un administrateur peut annuler un événement", 403);
    }

    const result = await client.query(
      `UPDATE events
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    // Business Rule 4: When cancelled, cancel all registrations
    if (status === 'cancelled' && currentEvent.status !== 'cancelled') {
      await client.query(
        `UPDATE registrations 
         SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP 
         WHERE event_id = $1 AND status != 'cancelled'`,
        [id]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({
      status: 'success',
      data: {
        event: result.rows[0],
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
 * DELETE /api/events/:id (Admin only)
 */
const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new AppError('Événement introuvable', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Événement supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  updateEventStatus,
  deleteEvent,
};
