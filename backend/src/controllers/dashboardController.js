const db = require('../config/db');

/**
 * GET /api/dashboard/stats
 * Minimum required metrics:
 * 1. Total events count
 * 2. Published events count
 * 3. Today's registrations count
 * 4. Top 5 most filled events
 */
const getStats = async (req, res, next) => {
  try {
    // 1. Total events
    const totalEventsQuery = await db.query('SELECT COUNT(*)::int AS count FROM events');
    const totalEvents = totalEventsQuery.rows[0].count;

    // 2. Published events
    const publishedEventsQuery = await db.query(
      "SELECT COUNT(*)::int AS count FROM events WHERE status = 'published'"
    );
    const publishedEvents = publishedEventsQuery.rows[0].count;

    // 3. Draft and cancelled events for extra completeness
    const draftEventsQuery = await db.query(
      "SELECT COUNT(*)::int AS count FROM events WHERE status = 'draft'"
    );
    const draftEvents = draftEventsQuery.rows[0].count;

    const cancelledEventsQuery = await db.query(
      "SELECT COUNT(*)::int AS count FROM events WHERE status = 'cancelled'"
    );
    const cancelledEvents = cancelledEventsQuery.rows[0].count;

    // 4. Registrations of the day (created_at >= CURRENT_DATE)
    const registrationsTodayQuery = await db.query(`
      SELECT COUNT(*)::int AS count 
      FROM registrations 
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    const registrationsToday = registrationsTodayQuery.rows[0].count;

    // 5. Total participants
    const totalParticipantsQuery = await db.query('SELECT COUNT(*)::int AS count FROM participants');
    const totalParticipants = totalParticipantsQuery.rows[0].count;

    // 6. Total active registrations
    const totalRegistrationsQuery = await db.query(
      "SELECT COUNT(*)::int AS count FROM registrations WHERE status != 'cancelled'"
    );
    const totalRegistrations = totalRegistrationsQuery.rows[0].count;

    // 7. Top 5 events most filled
    const top5EventsQuery = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.location,
        e.event_date,
        e.status,
        e.max_participants,
        COUNT(r.id) FILTER (WHERE r.status != 'cancelled')::int AS registered_count,
        ROUND(
          (COUNT(r.id) FILTER (WHERE r.status != 'cancelled')::decimal / NULLIF(e.max_participants, 0)) * 100, 
          1
        ) AS fill_percentage
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id
      GROUP BY e.id, e.title, e.location, e.event_date, e.status, e.max_participants
      ORDER BY registered_count DESC, fill_percentage DESC
      LIMIT 5
    `);
    const top5Events = top5EventsQuery.rows;

    // 8. Registrations status breakdown
    const statusBreakdownQuery = await db.query(`
      SELECT 
        status, 
        COUNT(*)::int AS count 
      FROM registrations 
      GROUP BY status
    `);
    const statusBreakdown = statusBreakdownQuery.rows;

    // 9. Last 7 days registration trend
    const last7DaysTrendQuery = await db.query(`
      SELECT 
        TO_CHAR(d.day, 'DD/MM') AS date_label,
        TO_CHAR(d.day, 'YYYY-MM-DD') AS full_date,
        COUNT(r.id)::int AS count
      FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d(day)
      LEFT JOIN registrations r ON DATE(r.created_at) = DATE(d.day)
      GROUP BY d.day
      ORDER BY d.day ASC
    `);
    const dailyTrend = last7DaysTrendQuery.rows;

    // 10. Recent activity (latest registrations)
    const recentRegistrationsQuery = await db.query(`
      SELECT 
        r.id,
        r.status,
        r.created_at,
        e.title AS event_title,
        p.full_name AS participant_name,
        p.email AS participant_email
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN participants p ON r.participant_id = p.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);
    const recentActivity = recentRegistrationsQuery.rows;

    res.status(200).json({
      status: 'success',
      data: {
        totalEvents,
        publishedEvents,
        draftEvents,
        cancelledEvents,
        registrationsToday,
        totalParticipants,
        totalRegistrations,
        top5Events,
        statusBreakdown,
        dailyTrend,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
};
