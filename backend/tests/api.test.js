const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('EventHub API Integration Tests', () => {
  let adminToken = '';
  let staffToken = '';
  let publishedEventId = 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa';
  let draftEventId = 'aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa';
  let fullEventId = 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa'; // capacity 5, already has 5 registrations
  let participant1Id = 'bbbbbbbb-0001-0000-0000-bbbbbbbbbbbb';
  let participant2Id = 'bbbbbbbb-0002-0000-0000-bbbbbbbbbbbb';
  let nonRegisteredParticipantId = 'bbbbbbbb-0009-0000-0000-bbbbbbbbbbbb';

  afterAll(async () => {
    await db.pool.end();
  });

  describe('1. Authentication Endpoints', () => {
    it('should reject login with invalid credentials with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@eventhub.com', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.status).toBe('error');
    });

    it('should authenticate admin and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@eventhub.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('admin');
      adminToken = res.body.data.token;
    });

    it('should authenticate staff and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff@eventhub.com', password: 'password123' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('staff');
      staffToken = res.body.data.token;
    });

    it('should return profile on GET /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe('admin@eventhub.com');
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/events');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('2. Mandatory Business Rules Testing', () => {
    it('Règle 1 : Rejette inscription sur un événement non publié (draft) avec code 400', async () => {
      const res = await request(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          eventId: draftEventId,
          participantId: nonRegisteredParticipantId,
          status: 'confirmed',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/n'est pas publié/i);
    });

    it('Règle 2 : Rejette inscription en doublon pour le même participant avec 409', async () => {
      // Alice Martin (participant1Id) is already registered for Event 1 in the seed
      const res = await request(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          eventId: publishedEventId,
          participantId: participant1Id,
          status: 'confirmed',
        });

      expect(res.statusCode).toBe(409);
      expect(res.body.message).toMatch(/déjà inscrit/i);
    });

    it('Règle 3 : Bloque inscription si la capacité maxParticipants est atteinte avec 400', async () => {
      // Workshop has max_participants = 5, already 5 confirmed registrations
      // Test participant 9 is not yet registered for this workshop
      const res = await request(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          eventId: fullEventId,
          participantId: nonRegisteredParticipantId,
          status: 'confirmed',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/capacité maximale/i);
    });

    it('Règle 4 : Quand un événement passe à cancelled, toutes ses inscriptions passent à cancelled', async () => {
      // 1. Create a published event with 1 participant registered
      const createEventRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Event to Cancel',
          description: 'Testing cancellation cascade',
          location: 'Remote Test Lab',
          eventDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          maxParticipants: 10,
          status: 'published',
        });

      expect(createEventRes.statusCode).toBe(201);
      const testEventId = createEventRes.body.data.event.id;

      // Register participant
      const regRes = await request(app)
        .post('/api/registrations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          eventId: testEventId,
          participantId: participant1Id,
          status: 'confirmed',
        });
      expect(regRes.statusCode).toBe(201);
      expect(regRes.body.data.registration.status).toBe('confirmed');

      // Now cancel the event via PATCH /api/events/:id/status
      const cancelRes = await request(app)
        .patch(`/api/events/${testEventId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cancelled' });

      expect(cancelRes.statusCode).toBe(200);

      // Verify that registrations for this event are now cancelled
      const checkRegs = await request(app)
        .get(`/api/registrations?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(checkRegs.statusCode).toBe(200);
      expect(checkRegs.body.data.registrations.length).toBe(1);
      expect(checkRegs.body.data.registrations[0].status).toBe('cancelled');
    });
  });

  describe('3. Dashboard Stats Endpoint', () => {
    it('should return required statistics on GET /api/dashboard/stats', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.totalEvents).toBeGreaterThan(0);
      expect(res.body.data.publishedEvents).toBeGreaterThan(0);
      expect(res.body.data.registrationsToday).toBeDefined();
      expect(Array.isArray(res.body.data.top5Events)).toBe(true);
      expect(res.body.data.top5Events.length).toBeLessThanOrEqual(5);
    });
  });

  describe('4. Participants CRUD and Search', () => {
    let createdParticipantId = '';

    it('should search participants by name or email', async () => {
      const res = await request(app)
        .get('/api/participants?search=alice')
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.participants.length).toBeGreaterThan(0);
      expect(res.body.data.participants[0].full_name).toMatch(/alice/i);
    });

    it('should create a new participant', async () => {
      const res = await request(app)
        .post('/api/participants')
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'Nouveau Participant Test',
          email: 'test.participant@eventhub.com',
          phone: '+33 6 00 00 00 00',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.participant.email).toBe('test.participant@eventhub.com');
      createdParticipantId = res.body.data.participant.id;
    });

    it('should update participant', async () => {
      const res = await request(app)
        .put(`/api/participants/${createdParticipantId}`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          fullName: 'Participant Mis à Jour',
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.participant.full_name).toBe('Participant Mis à Jour');
    });
  });
});
