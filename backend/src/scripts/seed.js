const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function runSeed() {
  console.log('🌱 Seeding database...');
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Truncate
    await pool.query('TRUNCATE TABLE registrations, participants, events, users CASCADE;');

    // 2. Insert Users (1 Admin, 1 Staff)
    await pool.query(`
      INSERT INTO users (id, name, email, password, role) VALUES
      ('11111111-1111-1111-1111-111111111111', 'Admin Principal', 'admin@eventhub.com', $1, 'admin'),
      ('22222222-2222-2222-2222-222222222222', 'Staff Organisateur', 'staff@eventhub.com', $1, 'staff');
    `, [hashedPassword]);

    // 3. Insert Events (5 events: draft, published, cancelled)
    await pool.query(`
      INSERT INTO events (id, title, description, location, event_date, max_participants, status, created_by) VALUES
      ('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'AI & Cloud Summit 2026', 'Conférence internationale sur l intelligence artificielle, les LLM et les architectures cloud modernes.', 'Palais des Congrès, Paris', CURRENT_TIMESTAMP + INTERVAL '10 days', 30, 'published', '11111111-1111-1111-1111-111111111111'),
      ('aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'React & TypeScript Masterclass', 'Atelier intensif pour concevoir des applications web modulaires, scalables et typées.', 'Espace Turing, Lyon', CURRENT_TIMESTAMP + INTERVAL '15 days', 8, 'published', '22222222-2222-2222-2222-222222222222'),
      ('aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'Cybersécurité & DevSecOps Workshop', 'Hands-on sur les failles OWASP, le durcissement d API REST et les pipelines CI/CD sécurisés.', 'Station F, Paris', CURRENT_TIMESTAMP + INTERVAL '5 days', 5, 'published', '11111111-1111-1111-1111-111111111111'),
      ('aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa', 'Green IT & Éco-Conception Logicielle', 'Webinaire sur les métriques d empreinte carbone logicielle et l optimisation des requêtes SQL.', 'En ligne (Zoom)', CURRENT_TIMESTAMP + INTERVAL '30 days', 50, 'draft', '22222222-2222-2222-2222-222222222222'),
      ('aaaaaaaa-5555-5555-5555-aaaaaaaaaaaa', 'Séminaire Legacy Migration PHP to Node', 'Session d analyse des stratégies de refonte d applications monolithiques.', 'Chambre de Commerce, Nantes', CURRENT_TIMESTAMP - INTERVAL '2 days', 20, 'cancelled', '11111111-1111-1111-1111-111111111111');
    `);

    // 4. Insert Participants (10 participants)
    await pool.query(`
      INSERT INTO participants (id, full_name, email, phone) VALUES
      ('bbbbbbbb-0001-0000-0000-bbbbbbbbbbbb', 'Alice Martin', 'alice.martin@example.com', '+33 6 12 34 56 78'),
      ('bbbbbbbb-0002-0000-0000-bbbbbbbbbbbb', 'Bob Dupont', 'bob.dupont@example.com', '+33 6 23 45 67 89'),
      ('bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb', 'Clara Bernard', 'clara.bernard@example.com', '+33 6 34 56 78 90'),
      ('bbbbbbbb-0004-0000-0000-bbbbbbbbbbbb', 'David Robert', 'david.robert@example.com', '+33 6 45 67 89 01'),
      ('bbbbbbbb-0005-0000-0000-bbbbbbbbbbbb', 'Emma Richard', 'emma.richard@example.com', '+33 6 56 78 90 12'),
      ('bbbbbbbb-0006-0000-0000-bbbbbbbbbbbb', 'Franck Petit', 'franck.petit@example.com', '+33 6 67 89 01 23'),
      ('bbbbbbbb-0007-0000-0000-bbbbbbbbbbbb', 'Grace Leroy', 'grace.leroy@example.com', '+33 6 78 90 12 34'),
      ('bbbbbbbb-0008-0000-0000-bbbbbbbbbbbb', 'Hugo Moreau', 'hugo.moreau@example.com', '+33 6 89 01 23 45'),
      ('bbbbbbbb-0009-0000-0000-bbbbbbbbbbbb', 'Ines Simon', 'ines.simon@example.com', '+33 6 90 12 34 56'),
      ('bbbbbbbb-0010-0000-0000-bbbbbbbbbbbb', 'Julien Laurent', 'julien.laurent@example.com', '+33 6 01 23 45 67');
    `);

    // 5. Insert Registrations (20 registrations)
    await pool.query(`
      INSERT INTO registrations (id, event_id, participant_id, status, created_at) VALUES
      ('cccccccc-0001-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
      ('cccccccc-0002-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
      ('cccccccc-0003-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
      ('cccccccc-0004-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0004-0000-0000-bbbbbbbbbbbb', 'pending',   CURRENT_TIMESTAMP - INTERVAL '2 days'),
      ('cccccccc-0005-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0005-0000-0000-bbbbbbbbbbbb', 'pending',   CURRENT_TIMESTAMP),
      ('cccccccc-0006-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0006-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '3 days'),
      ('cccccccc-0007-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0007-0000-0000-bbbbbbbbbbbb', 'cancelled', CURRENT_TIMESTAMP - INTERVAL '4 days'),

      ('cccccccc-0008-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
      ('cccccccc-0009-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
      ('cccccccc-0010-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0008-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
      ('cccccccc-0011-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0009-0000-0000-bbbbbbbbbbbb', 'pending',   CURRENT_TIMESTAMP - INTERVAL '2 days'),
      ('cccccccc-0012-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0010-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
      ('cccccccc-0013-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb', 'pending',   CURRENT_TIMESTAMP - INTERVAL '3 days'),

      ('cccccccc-0014-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0004-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
      ('cccccccc-0015-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0005-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
      ('cccccccc-0016-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0006-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
      ('cccccccc-0017-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0007-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '2 days'),
      ('cccccccc-0018-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0008-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '2 days'),

      ('cccccccc-0019-0000-0000-cccccccccccc', 'aaaaaaaa-5555-5555-5555-aaaaaaaaaaaa', 'bbbbbbbb-0009-0000-0000-bbbbbbbbbbbb', 'cancelled', CURRENT_TIMESTAMP - INTERVAL '5 days'),
      ('cccccccc-0020-0000-0000-cccccccccccc', 'aaaaaaaa-5555-5555-5555-aaaaaaaaaaaa', 'bbbbbbbb-0010-0000-0000-bbbbbbbbbbbb', 'cancelled', CURRENT_TIMESTAMP - INTERVAL '5 days');
    `);

    console.log('✅ Seed completed successfully with 2 users, 5 events, 10 participants, 20 registrations!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;
