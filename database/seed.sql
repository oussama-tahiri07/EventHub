-- =============================================================================
-- EventHub Database Seed Data
-- =============================================================================

-- Clear existing data
TRUNCATE TABLE registrations, participants, events, users CASCADE;

-- 1. USERS (1 Admin, 1 Staff)
-- Passwords are encrypted for: password123
-- Hash: $2a$10$6N6F4lK1G1M5O0rIqM7WcebL1lVf6e5O3xXyZ7BfKqIe/O2n.z0nS or standard bcrypt hash
INSERT INTO users (id, name, email, password, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Admin Principal', 'admin@eventhub.com', '$2a$10$amHqe1h70sIBRXpUBZ/rguil/QxLobHKLFZxJUHmiM8XqKW.jHyrK', 'admin'),
('22222222-2222-2222-2222-222222222222', 'Staff Organisateur', 'staff@eventhub.com', '$2a$10$amHqe1h70sIBRXpUBZ/rguil/QxLobHKLFZxJUHmiM8XqKW.jHyrK', 'staff');

-- 2. EVENTS (5 events: draft, published, cancelled)
INSERT INTO events (id, title, description, location, event_date, max_participants, status, created_by) VALUES
-- Event 1: Published, high capacity
('aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'AI & Cloud Summit 2026', 'Conférence internationale sur l intelligence artificielle, les LLM et les infrastructures cloud scalables.', 'Palais des Congrès, Paris', CURRENT_TIMESTAMP + INTERVAL '10 days', 30, 'published', '11111111-1111-1111-1111-111111111111'),

-- Event 2: Published, near capacity / popular
('aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'React & TypeScript Masterclass', 'Atelier intensif pour maîtriser les architectures modernes React, Next.js et la gestion d état optimisée.', 'Espace Turing, Lyon', CURRENT_TIMESTAMP + INTERVAL '15 days', 8, 'published', '22222222-2222-2222-2222-222222222222'),

-- Event 3: Published, small capacity (filled)
('aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'Cybersécurité & DevSecOps Workshop', 'Hands-on sur les failles OWASP, le durcissement d API Node.js et la sécurité conteneurs.', 'Station F, Paris', CURRENT_TIMESTAMP + INTERVAL '5 days', 5, 'published', '11111111-1111-1111-1111-111111111111'),

-- Event 4: Draft (cannot register participants here)
('aaaaaaaa-4444-4444-4444-aaaaaaaaaaaa', 'Green IT & Éco-Conception Logicielle', 'Webinaire sur les métriques d empreinte carbone logicielle et l optimisation des requêtes SQL.', 'En ligne (Zoom)', CURRENT_TIMESTAMP + INTERVAL '30 days', 50, 'draft', '22222222-2222-2222-2222-222222222222'),

-- Event 5: Cancelled (all registrations cancelled)
('aaaaaaaa-5555-5555-5555-aaaaaaaaaaaa', 'Séminaire Legacy Migration PHP to Node', 'Session d analyse des stratégies de refonte d applications monolithiques.', 'Chambre de Commerce, Nantes', CURRENT_TIMESTAMP - INTERVAL '2 days', 20, 'cancelled', '11111111-1111-1111-1111-111111111111');

-- 3. PARTICIPANTS (10 participants)
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

-- 4. REGISTRATIONS (20 registrations with varied statuses & dates)
-- Including registrations from today for the dashboard statistics
INSERT INTO registrations (id, event_id, participant_id, status, created_at) VALUES
-- Event 1: AI & Cloud Summit (7 registrations)
('cccccccc-0001-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
('cccccccc-0002-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
('cccccccc-0003-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('cccccccc-0004-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0004-0000-0000-bbbbbbbbbbbb', 'pending',   CURRENT_TIMESTAMP - INTERVAL '2 days'),
('cccccccc-0005-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0005-0000-0000-bbbbbbbbbbbb', 'pending',   CURRENT_TIMESTAMP),
('cccccccc-0006-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0006-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '3 days'),
('cccccccc-0007-0000-0000-cccccccccccc', 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', 'bbbbbbbb-0007-0000-0000-bbbbbbbbbbbb', 'cancelled', CURRENT_TIMESTAMP - INTERVAL '4 days'),

-- Event 2: React Masterclass (6 registrations)
('cccccccc-0008-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0001-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
('cccccccc-0009-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0002-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('cccccccc-0010-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0008-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
('cccccccc-0011-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0009-0000-0000-bbbbbbbbbbbb', 'pending',   CURRENT_TIMESTAMP - INTERVAL '2 days'),
('cccccccc-0012-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0010-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
('cccccccc-0013-0000-0000-cccccccccccc', 'aaaaaaaa-2222-2222-2222-aaaaaaaaaaaa', 'bbbbbbbb-0003-0000-0000-bbbbbbbbbbbb', 'pending',   CURRENT_TIMESTAMP - INTERVAL '3 days'),

-- Event 3: Cybersécurité (5 registrations -> capacity 5/5 reached)
('cccccccc-0014-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0004-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP),
('cccccccc-0015-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0005-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('cccccccc-0016-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0006-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '1 day'),
('cccccccc-0017-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0007-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '2 days'),
('cccccccc-0018-0000-0000-cccccccccccc', 'aaaaaaaa-3333-3333-3333-aaaaaaaaaaaa', 'bbbbbbbb-0008-0000-0000-bbbbbbbbbbbb', 'confirmed', CURRENT_TIMESTAMP - INTERVAL '2 days'),

-- Event 5: Cancelled Event (2 registrations, both cancelled as required by business rule #3)
('cccccccc-0019-0000-0000-cccccccccccc', 'aaaaaaaa-5555-5555-5555-aaaaaaaaaaaa', 'bbbbbbbb-0009-0000-0000-bbbbbbbbbbbb', 'cancelled', CURRENT_TIMESTAMP - INTERVAL '5 days'),
('cccccccc-0020-0000-0000-cccccccccccc', 'aaaaaaaa-5555-5555-5555-aaaaaaaaaaaa', 'bbbbbbbb-0010-0000-0000-bbbbbbbbbbbb', 'cancelled', CURRENT_TIMESTAMP - INTERVAL '5 days');
