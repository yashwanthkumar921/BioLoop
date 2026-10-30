-- PostGIS is optional. When the extension is present, pickup_location is
-- populated and ST_DWithin queries can replace Haversine.
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS postgis;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'PostGIS is not installed; BioLoop will use lat/lng Haversine matching.';
END
$$;

CREATE TABLE users (
    id              UUID PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    org_name        VARCHAR(255) NOT NULL,
    role            VARCHAR(32)  NOT NULL,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    address         TEXT,
    phone           VARCHAR(32),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_role_chk CHECK (role IN ('GENERATOR', 'PROCESSOR', 'DRIVER', 'ADMIN'))
);

CREATE INDEX idx_users_role ON users (role);

CREATE TABLE waste_batches (
    id               UUID PRIMARY KEY,
    generator_id     UUID NOT NULL REFERENCES users (id),
    processor_id     UUID REFERENCES users (id),
    waste_type       VARCHAR(32) NOT NULL,
    weight_kg        NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
    status           VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    pickup_lat       DOUBLE PRECISION NOT NULL,
    pickup_lng       DOUBLE PRECISION NOT NULL,
    pickup_address   TEXT,
    expiry_time      TIMESTAMPTZ NOT NULL,
    qr_token         VARCHAR(64) NOT NULL UNIQUE,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT batches_type_chk CHECK (waste_type IN (
        'RAW_VEGETABLE', 'COOKED_MEAT', 'COFFEE_GROUNDS', 'MIXED_ORGANIC', 'DAIRY', 'BAKERY'
    )),
    CONSTRAINT batches_status_chk CHECK (status IN (
        'AVAILABLE', 'CLAIMED', 'IN_TRANSIT', 'DELIVERED', 'VERIFIED', 'EXPIRED', 'REJECTED'
    ))
);

CREATE INDEX idx_batches_status ON waste_batches (status);
CREATE INDEX idx_batches_generator ON waste_batches (generator_id);
CREATE INDEX idx_batches_processor ON waste_batches (processor_id);
CREATE INDEX idx_batches_expiry ON waste_batches (expiry_time);
CREATE INDEX idx_batches_coords ON waste_batches (pickup_lat, pickup_lng);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);
        ALTER TABLE waste_batches ADD COLUMN IF NOT EXISTS pickup_location GEOGRAPHY(POINT, 4326);
        CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);
        CREATE INDEX IF NOT EXISTS idx_batches_pickup ON waste_batches USING GIST (pickup_location);
    END IF;
END
$$;

CREATE TABLE transactions (
    id                    UUID PRIMARY KEY,
    batch_id              UUID NOT NULL UNIQUE REFERENCES waste_batches (id),
    driver_id             UUID REFERENCES users (id),
    contamination_pct     NUMERIC(5, 2) NOT NULL DEFAULT 0
                          CHECK (contamination_pct >= 0 AND contamination_pct <= 100),
    verified_weight_kg    NUMERIC(10, 2),
    co2_offset_kg         NUMERIC(12, 4),
    pickup_scanned_at     TIMESTAMPTZ,
    delivered_at          TIMESTAMPTZ,
    verified_at           TIMESTAMPTZ,
    contamination_notes   TEXT,
    certificate_code      VARCHAR(64) UNIQUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE batch_events (
    id           UUID PRIMARY KEY,
    batch_id     UUID NOT NULL REFERENCES waste_batches (id) ON DELETE CASCADE,
    actor_id     UUID REFERENCES users (id),
    from_status  VARCHAR(32),
    to_status    VARCHAR(32) NOT NULL,
    note         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_batch_events_batch ON batch_events (batch_id, created_at);

CREATE TABLE proof_uploads (
    id           UUID PRIMARY KEY,
    batch_id     UUID NOT NULL REFERENCES waste_batches (id) ON DELETE CASCADE,
    uploaded_by  UUID NOT NULL REFERENCES users (id),
    kind         VARCHAR(32) NOT NULL,
    file_path    TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT proof_kind_chk CHECK (kind IN ('PICKUP', 'DELIVERY', 'CONTAMINATION'))
);
