-- ====================================================================
-- Project Prahari — V1 Database Schema (PostGIS)
-- Multi-Hazard Disaster Intelligence Platform
-- ====================================================================
-- This migration creates the foundational schema for Prahari.
-- All spatial columns use SRID 4326 (WGS 84 — standard GPS coordinates).
-- GIST indexes are created on every geometry column for fast spatial queries.
-- ====================================================================

-- Enable PostGIS extension (idempotent — safe to re-run)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ====================================================================
-- 1. ROLES — RBAC role definitions
-- Hierarchy: SUPER_ADMIN > GOVERNMENT > NGO > CITIZEN
-- ====================================================================
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Role-Based Access Control definitions. Hierarchy: SUPER_ADMIN > GOVERNMENT > NGO > CITIZEN';
COMMENT ON COLUMN roles.name IS 'Unique role identifier: CITIZEN, NGO, GOVERNMENT, SUPER_ADMIN';

-- ====================================================================
-- 2. USERS — All platform users with geolocation
-- The `location` column stores the user''s last known GPS coordinates.
-- This is used by the Alert Engine (ST_Within) to determine if a user
-- falls inside a newly created hazard polygon.
-- ====================================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    whatsapp_id     VARCHAR(20),
    role_id         VARCHAR(20) NOT NULL
        CHECK (role_id IN ('CITIZEN', 'NGO', 'GOVERNMENT', 'SUPER_ADMIN')),
    location        GEOMETRY(Point, 4326),
    organization    VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Platform users with PostGIS Point location for spatial alert targeting';
COMMENT ON COLUMN users.location IS 'User GPS coordinates (SRID 4326). Used by ST_Within to find users inside hazard zones';
COMMENT ON COLUMN users.whatsapp_id IS 'WhatsApp phone number for Business API template messages';
COMMENT ON COLUMN users.organization IS 'NGO name or Government department/agency';

-- ====================================================================
-- 3. HAZARD_ZONES — Core of the Digital Twin
-- Each row represents an active or historical hazard zone.
-- The `geometry` column holds the hazard polygon (or buffer circle).
-- When a new hazard is inserted, the Alert Engine queries all users
-- whose `location` falls within this polygon using PostGIS ST_Within.
-- ====================================================================
CREATE TABLE hazard_zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_type     VARCHAR(20) NOT NULL
        CHECK (hazard_type IN ('FLOOD', 'EARTHQUAKE', 'LANDSLIDE', 'AIR_QUALITY')),
    severity        VARCHAR(10) NOT NULL
        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title           VARCHAR(255) NOT NULL,
    description     TEXT,
    geometry        GEOMETRY(Geometry, 4326) NOT NULL,
    radius_km       DOUBLE PRECISION,
    source          VARCHAR(100),
    source_event_id VARCHAR(255),
    metadata        JSONB DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    started_at      TIMESTAMPTZ NOT NULL,
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE hazard_zones IS 'Active and historical hazard zones with PostGIS geometry for spatial alerting';
COMMENT ON COLUMN hazard_zones.geometry IS 'Polygon/MultiPolygon representing the hazard area (SRID 4326)';
COMMENT ON COLUMN hazard_zones.radius_km IS 'Radius in kilometers (for earthquake buffer circles)';
COMMENT ON COLUMN hazard_zones.metadata IS 'Flexible JSONB: magnitude, depth, water_level, aqi_value, etc.';
COMMENT ON COLUMN hazard_zones.source IS 'Data source: USGS, CWC, LHASA, AQICN';
COMMENT ON COLUMN hazard_zones.source_event_id IS 'External API event ID for deduplication';

-- ====================================================================
-- 4. SOS_REQUESTS — Citizen panic button requests
-- Each SOS has a GPS point and is linked to a user and (optionally)
-- a hazard zone. Government and NGO users can claim/resolve SOS requests.
-- K-Means clustering on SOS locations generates heatmaps for the
-- Government Command View.
-- ====================================================================
CREATE TABLE sos_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    location        GEOMETRY(Point, 4326) NOT NULL,
    message         TEXT,
    status          VARCHAR(20) DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED')),
    hazard_zone_id  UUID REFERENCES hazard_zones(id) ON DELETE SET NULL,
    responder_id    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ
);

COMMENT ON TABLE sos_requests IS 'Citizen SOS panic button requests with GPS location';
COMMENT ON COLUMN sos_requests.responder_id IS 'NGO or Government user who claimed this SOS';
COMMENT ON COLUMN sos_requests.status IS 'Lifecycle: ACTIVE → ACKNOWLEDGED → RESOLVED or EXPIRED';

-- ====================================================================
-- 5. RELIEF_CAMPS — NGO/Government-managed relief facilities
-- Each camp has a GPS point and capacity tracking.
-- ====================================================================
CREATE TABLE relief_camps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    location        GEOMETRY(Point, 4326) NOT NULL,
    address         TEXT,
    capacity        INTEGER NOT NULL DEFAULT 0,
    current_occupancy INTEGER DEFAULT 0,
    managed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    contact_phone   VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE relief_camps IS 'Relief camps/shelters with capacity tracking and GPS location';
COMMENT ON COLUMN relief_camps.managed_by IS 'NGO or Government user managing this camp';

-- ====================================================================
-- 6. INVENTORY_ITEMS — Relief camp supply inventory
-- Tracks supplies at each camp with deficit/surplus calculations.
-- NGOs can claim deficits; the system matches surplus across camps.
-- ====================================================================
CREATE TABLE inventory_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camp_id         UUID NOT NULL REFERENCES relief_camps(id) ON DELETE CASCADE,
    item_name       VARCHAR(100) NOT NULL,
    category        VARCHAR(50)
        CHECK (category IN ('FOOD', 'WATER', 'MEDICAL', 'SHELTER', 'CLOTHING', 'HYGIENE', 'OTHER')),
    quantity        INTEGER NOT NULL DEFAULT 0,
    unit            VARCHAR(20) DEFAULT 'units',
    minimum_required INTEGER DEFAULT 0,
    last_updated    TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE inventory_items IS 'Relief camp supply inventory with category tracking';
COMMENT ON COLUMN inventory_items.minimum_required IS 'Minimum stock level. quantity < minimum_required = deficit';

-- ====================================================================
-- 7. RIVER_STATIONS — CWC telemetry monitoring stations
-- Pre-populated with key NE India river monitoring stations.
-- Each station has danger/warning water levels for threshold alerting.
-- ====================================================================
CREATE TABLE river_stations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_code    VARCHAR(50) UNIQUE NOT NULL,
    station_name    VARCHAR(255) NOT NULL,
    river_name      VARCHAR(100) NOT NULL,
    basin           VARCHAR(100),
    state           VARCHAR(50),
    location        GEOMETRY(Point, 4326) NOT NULL,
    danger_level    DOUBLE PRECISION,
    warning_level   DOUBLE PRECISION,
    highest_flood_level DOUBLE PRECISION,
    zero_gauge_rl   DOUBLE PRECISION,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE river_stations IS 'CWC river monitoring stations for NE India, Nepal, Bhutan';
COMMENT ON COLUMN river_stations.danger_level IS 'Water level (meters) above which flooding is expected';
COMMENT ON COLUMN river_stations.warning_level IS 'Water level (meters) for early warning alerts';

-- ====================================================================
-- 8. RIVER_READINGS — Time-series water level data
-- Ingested by the CWC scraper every 15 minutes during monsoon.
-- ====================================================================
CREATE TABLE river_readings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id      UUID NOT NULL REFERENCES river_stations(id) ON DELETE CASCADE,
    water_level     DOUBLE PRECISION NOT NULL,
    flow_rate       DOUBLE PRECISION,
    trend           VARCHAR(10) CHECK (trend IN ('RISING', 'FALLING', 'STEADY')),
    reading_time    TIMESTAMPTZ NOT NULL,
    is_above_danger BOOLEAN DEFAULT FALSE,
    is_above_warning BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE river_readings IS 'Time-series water level readings from CWC stations';
COMMENT ON COLUMN river_readings.trend IS 'Water level trend: RISING, FALLING, or STEADY';

-- ====================================================================
-- 9. ALERT_LOGS — Audit trail for all dispatched alerts
-- Every WhatsApp/SMS sent by the Alert Engine is logged here.
-- Used for delivery tracking, debugging, and compliance.
-- ====================================================================
CREATE TABLE alert_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hazard_zone_id  UUID REFERENCES hazard_zones(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    channel         VARCHAR(20) NOT NULL
        CHECK (channel IN ('WHATSAPP', 'SMS_TWILIO', 'SMS_FAST2SMS', 'PUSH', 'EMAIL')),
    status          VARCHAR(20) NOT NULL
        CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'FALLBACK')),
    template_name   VARCHAR(100),
    message_preview TEXT,
    external_msg_id VARCHAR(255),
    error_message   TEXT,
    attempted_at    TIMESTAMPTZ DEFAULT NOW(),
    delivered_at    TIMESTAMPTZ
);

COMMENT ON TABLE alert_logs IS 'Audit trail for all alerts dispatched by the Alert Engine';
COMMENT ON COLUMN alert_logs.status IS 'FALLBACK = WhatsApp failed, fell back to SMS';

-- ====================================================================
-- 10. AIR_QUALITY_READINGS — AQICN data snapshots
-- ====================================================================
CREATE TABLE air_quality_readings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_name    VARCHAR(255) NOT NULL,
    location        GEOMETRY(Point, 4326) NOT NULL,
    aqi             INTEGER NOT NULL,
    dominant_pollutant VARCHAR(20),
    pm25            DOUBLE PRECISION,
    pm10            DOUBLE PRECISION,
    o3              DOUBLE PRECISION,
    no2             DOUBLE PRECISION,
    co              DOUBLE PRECISION,
    so2             DOUBLE PRECISION,
    reading_time    TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE air_quality_readings IS 'AQICN air quality index snapshots for NE India region';

-- ====================================================================
-- SPATIAL INDEXES — Critical for ST_Within / ST_DWithin performance
-- GIST indexes enable sub-millisecond spatial queries on large datasets.
-- ====================================================================
CREATE INDEX idx_users_location
    ON users USING GIST (location);

CREATE INDEX idx_hazard_zones_geometry
    ON hazard_zones USING GIST (geometry);

CREATE INDEX idx_sos_requests_location
    ON sos_requests USING GIST (location);

CREATE INDEX idx_relief_camps_location
    ON relief_camps USING GIST (location);

CREATE INDEX idx_river_stations_location
    ON river_stations USING GIST (location);

CREATE INDEX idx_air_quality_location
    ON air_quality_readings USING GIST (location);

-- ====================================================================
-- PARTIAL INDEXES — Optimize queries that filter on active records
-- ====================================================================
CREATE INDEX idx_hazard_zones_active
    ON hazard_zones (is_active, hazard_type) WHERE is_active = TRUE;

CREATE INDEX idx_sos_requests_active
    ON sos_requests (status) WHERE status = 'ACTIVE';

CREATE INDEX idx_relief_camps_active
    ON relief_camps (is_active) WHERE is_active = TRUE;

-- ====================================================================
-- B-TREE INDEXES — For common lookups
-- ====================================================================
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role_id);
CREATE INDEX idx_hazard_zones_source_event ON hazard_zones (source_event_id);
CREATE INDEX idx_river_readings_station_time ON river_readings (station_id, reading_time DESC);
CREATE INDEX idx_alert_logs_hazard ON alert_logs (hazard_zone_id);
CREATE INDEX idx_alert_logs_user ON alert_logs (user_id);
CREATE INDEX idx_air_quality_time ON air_quality_readings (reading_time DESC);

-- ====================================================================
-- FUNCTIONS — Utility functions for the Alert Engine
-- ====================================================================

-- Find all active users within a given hazard zone polygon
-- Used by AlertOrchestrator.java to fan out alerts
CREATE OR REPLACE FUNCTION find_users_in_hazard_zone(zone_id UUID)
RETURNS TABLE (
    user_id     UUID,
    email       VARCHAR,
    full_name   VARCHAR,
    phone       VARCHAR,
    whatsapp_id VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.whatsapp_id
    FROM users u
    JOIN hazard_zones hz ON ST_Within(u.location, hz.geometry)
    WHERE hz.id = zone_id
      AND hz.is_active = TRUE
      AND u.is_active = TRUE
      AND u.location IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_users_in_hazard_zone IS 'Finds all active users whose location falls within a hazard zone polygon. Core of the Alert Engine.';

-- Create a circular hazard zone from a center point and radius
-- Used for earthquake buffer zones
CREATE OR REPLACE FUNCTION create_circle_zone(
    center_lon DOUBLE PRECISION,
    center_lat DOUBLE PRECISION,
    radius_km  DOUBLE PRECISION
)
RETURNS GEOMETRY AS $$
BEGIN
    -- ST_Buffer with geography cast creates a proper geodetic circle
    -- Cast back to geometry for storage in hazard_zones table
    RETURN ST_Transform(
        ST_Buffer(
            ST_Transform(
                ST_SetSRID(ST_MakePoint(center_lon, center_lat), 4326),
                3857  -- Web Mercator for accurate distance-based buffer
            ),
            radius_km * 1000  -- Convert km to meters
        ),
        4326  -- Convert back to WGS84 for storage
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_circle_zone IS 'Creates a circular hazard polygon from center coordinates and radius in km. Used for earthquake impact zones.';
