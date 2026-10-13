const db = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

/**
 * POST /api/participants
 * Create participant
 */
const createParticipant = async (req, res, next) => {
  try {
    const { fullName, email, phone } = req.body;

    const result = await db.query(
      `INSERT INTO participants (full_name, email, phone)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [fullName.trim(), email.toLowerCase().trim(), phone ? phone.trim() : null]
    );

    res.status(201).json({
      status: 'success',
      data: {
        participant: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/participants?search=&page=&limit=
 * List participants with search filter on fullName or email
 */
const getParticipants = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      conditions.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM participants ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const query = `
      SELECT 
        p.*,
        COUNT(r.id)::int AS total_registrations
      FROM participants p
      LEFT JOIN registrations r ON p.id = r.participant_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const result = await db.query(query, [...params, limit, offset]);

    res.status(200).json({
      status: 'success',
      data: {
        participants: result.rows,
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
 * GET /api/participants/:id
 * Retrieve participant details + event registrations history
 */
const getParticipantById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const participantResult = await db.query(
      'SELECT * FROM participants WHERE id = $1',
      [id]
    );

    if (participantResult.rows.length === 0) {
      throw new AppError('Participant introuvable', 404);
    }

    const registrationsResult = await db.query(
      `SELECT 
        r.id AS registration_id,
        r.status AS registration_status,
        r.created_at AS registered_at,
        e.id AS event_id,
        e.title AS event_title,
        e.event_date,
        e.location,
        e.status AS event_status
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.participant_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );

    res.status(200).json({
      status: 'success',
      data: {
        participant: participantResult.rows[0],
        registrations: registrationsResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/participants/:id
 * Update participant
 */
const updateParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone } = req.body;

    const result = await db.query(
      `UPDATE participants
       SET 
         full_name = COALESCE($1, full_name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [
        fullName ? fullName.trim() : null,
        email ? email.toLowerCase().trim() : null,
        phone !== undefined ? (phone ? phone.trim() : null) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      throw new AppError('Participant introuvable', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        participant: result.rows[0],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/participants/:id
 */
const deleteParticipant = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query('DELETE FROM participants WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      throw new AppError('Participant introuvable', 404);
    }

    res.status(200).json({
      status: 'success',
      message: 'Participant supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createParticipant,
  getParticipants,
  getParticipantById,
  updateParticipant,
  deleteParticipant,
};
