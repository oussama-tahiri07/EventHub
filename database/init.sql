-- =============================================================================
-- EventHub Database Initialization Script
-- Compatible with PostgreSQL 14+
-- =============================================================================

-- Enable pgcrypto for UUID generation if needed (gen_random_uuid is native in PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean existing tables if script is rerun
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. EVENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    max_participants INTEGER NOT NULL CHECK (max_participants > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. PARTICIPANTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. REGISTRATIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'waitlist')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_event_participant UNIQUE (event_id, participant_id)
);

-- -----------------------------------------------------------------------------
-- 5. INDEXES FOR PERFORMANCE & SEARCH
-- -----------------------------------------------------------------------------
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_participants_email ON participants(email);
CREATE INDEX idx_participants_name ON participants(full_name);
CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_registrations_participant ON registrations(participant_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_registrations_created_at ON registrations(created_at);

-- -----------------------------------------------------------------------------
-- 6. TRIGGERS & FUNCTIONS
-- -----------------------------------------------------------------------------

-- Trigger function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_participants_updated_at
BEFORE UPDATE ON participants
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER trg_registrations_updated_at
BEFORE UPDATE ON registrations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Trigger function: Business Rule 4 -> When event is cancelled, cancel all its registrations
CREATE OR REPLACE FUNCTION cascade_event_cancellation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
        UPDATE registrations
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE event_id = NEW.id AND status <> 'cancelled';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_cancellation
AFTER UPDATE OF status ON events
FOR EACH ROW
WHEN (NEW.status = 'cancelled')
EXECUTE FUNCTION cascade_event_cancellation();
