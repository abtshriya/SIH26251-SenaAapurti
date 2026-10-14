-- =============================================================================
-- SENA AAPURTI: POSTGIS & TAMPER-EVIDENT CRYPTOGRAPHIC LEDGER SCHEMA
-- Classification: RESTRICTED // SIH PROTOTYPE (SIH26251)
-- =============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Spatial & Core Operational Tables
CREATE TABLE IF NOT EXISTS units (
    unit_id VARCHAR(48) PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    echelon_level VARCHAR(64) NOT NULL,
    sector VARCHAR(64) NOT NULL DEFAULT 'NORTHERN-COMMAND',
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_units_geom ON units USING GIST (geom);

CREATE TABLE IF NOT EXISTS inventory_items (
    sku VARCHAR(48) PRIMARY KEY,
    item_name VARCHAR(160) NOT NULL,
    category VARCHAR(64) NOT NULL,
    unit_of_measure VARCHAR(32) NOT NULL DEFAULT 'UNITS',
    critical_safety_threshold INTEGER NOT NULL CHECK (critical_safety_threshold >= 0)
);

CREATE TABLE IF NOT EXISTS unit_stocks (
    unit_id VARCHAR(48) NOT NULL REFERENCES units(unit_id) ON DELETE CASCADE,
    sku VARCHAR(48) NOT NULL REFERENCES inventory_items(sku) ON DELETE CASCADE,
    current_quantity INTEGER NOT NULL CHECK (current_quantity >= 0),
    daily_burn_rate NUMERIC(10, 2) NOT NULL DEFAULT 15.0,
    last_sync_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (unit_id, sku)
);

-- 3. Multi-Stream Data Engine Spatial & Time-Series Tables (SIH26251)
CREATE TABLE IF NOT EXISTS nodes (
    node_id VARCHAR(48) PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    echelon VARCHAR(64) NOT NULL,
    sector VARCHAR(64) NOT NULL DEFAULT 'NORTHERN-COMMAND',
    elevation_m INTEGER NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326) NOT NULL,
    storage_capacity_tons DOUBLE PRECISION NOT NULL,
    baseline_troop_strength INTEGER NOT NULL DEFAULT 1000
);

CREATE INDEX IF NOT EXISTS idx_nodes_geom ON nodes USING GIST (geom);

CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(48) PRIMARY KEY,
    origin_id VARCHAR(48) NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
    destination_id VARCHAR(48) NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
    distance_km DOUBLE PRECISION NOT NULL,
    terrain_type VARCHAR(64) NOT NULL,
    seasonal_pass_name VARCHAR(96),
    default_lead_time_hrs DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(LineString, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_routes_geom ON routes USING GIST (geom);

CREATE TABLE IF NOT EXISTS consumption_history (
    record_id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    node_id VARCHAR(48) NOT NULL,
    sku VARCHAR(48) NOT NULL,
    units_consumed INTEGER NOT NULL,
    active_troop_count INTEGER NOT NULL,
    operational_tempo VARCHAR(32) NOT NULL,
    is_winter_stocking_surge BOOLEAN NOT NULL DEFAULT FALSE,
    is_forecast_window BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_consumption_ts_node ON consumption_history (timestamp, node_id, sku);

CREATE TABLE IF NOT EXISTS weather_telemetry (
    log_id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    node_id VARCHAR(48) NOT NULL,
    temperature_c DOUBLE PRECISION NOT NULL,
    snow_accumulation_cm DOUBLE PRECISION NOT NULL,
    wind_speed_kmh DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    avalanche_warning_level VARCHAR(16) NOT NULL DEFAULT 'GREEN',
    avalanche_risk_index DOUBLE PRECISION NOT NULL,
    landslide_risk_index DOUBLE PRECISION NOT NULL DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_weather_ts_node ON weather_telemetry (timestamp, node_id);

CREATE TABLE IF NOT EXISTS transit_missions (
    mission_id VARCHAR(64) PRIMARY KEY,
    route_id VARCHAR(48) NOT NULL,
    origin_id VARCHAR(48) NOT NULL,
    destination_id VARCHAR(48) NOT NULL,
    vehicle_type VARCHAR(48) NOT NULL,
    cargo_manifest JSONB NOT NULL,
    route_status VARCHAR(32) NOT NULL,
    delay_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    departure_time TIMESTAMPTZ NOT NULL,
    eta TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_missions_origin_dest ON transit_missions (origin_id, destination_id, route_status);

CREATE TABLE IF NOT EXISTS iot_telemetry_streams (
    telemetry_id VARCHAR(64) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    device_id VARCHAR(64) NOT NULL,
    node_id VARCHAR(48) NOT NULL,
    sku VARCHAR(48) NOT NULL,
    sensor_modality VARCHAR(48) NOT NULL,
    monotonic_seq_id INTEGER NOT NULL,
    reported_quantity DOUBLE PRECISION NOT NULL,
    weight_discrepancy_kg DOUBLE PRECISION NOT NULL,
    ambient_temp_c DOUBLE PRECISION NOT NULL,
    transit_vibration_g DOUBLE PRECISION NOT NULL,
    comms_blackout_flag BOOLEAN NOT NULL DEFAULT FALSE,
    hmac_tamper_flag BOOLEAN NOT NULL DEFAULT FALSE,
    hmac_signature TEXT NOT NULL
);

-- 4. Requisitions Table for High-Impact Approvals
CREATE TABLE IF NOT EXISTS requisitions (
    requisition_id VARCHAR(48) PRIMARY KEY,
    unit_id VARCHAR(48) NOT NULL REFERENCES units(unit_id),
    sku VARCHAR(48) NOT NULL REFERENCES inventory_items(sku),
    requested_quantity INTEGER NOT NULL CHECK (requested_quantity > 0),
    priority VARCHAR(32) NOT NULL DEFAULT 'CRITICAL',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING_MFA',
    approved_by VARCHAR(64),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Append-Only Cryptographic Audit Ledger
CREATE TABLE IF NOT EXISTS tamper_proof_audit_ledger (
    log_id BIGSERIAL PRIMARY KEY,
    previous_hash CHAR(64) NOT NULL,
    current_hash CHAR(64) NOT NULL UNIQUE,
    action VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    payload_hash CHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- 6. PL/pgSQL Trigger Function for Mathematical Hash Chaining
CREATE OR REPLACE FUNCTION chain_audit_hash()
RETURNS TRIGGER AS $$
DECLARE
    last_hash CHAR(64);
    canonical_ts TEXT;
    raw_material TEXT;
BEGIN
    IF NEW.timestamp IS NULL THEN
        NEW.timestamp := clock_timestamp();
    END IF;

    LOCK TABLE tamper_proof_audit_ledger IN EXCLUSIVE MODE;

    SELECT current_hash
      INTO last_hash
      FROM tamper_proof_audit_ledger
     ORDER BY log_id DESC
     LIMIT 1;

    IF last_hash IS NULL THEN
        last_hash := repeat('0', 64);
    END IF;

    NEW.previous_hash := last_hash;
    canonical_ts := to_char(NEW.timestamp AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"');
    raw_material := NEW.previous_hash || NEW.action || NEW.actor_id || NEW.payload_hash || canonical_ts;

    NEW.current_hash := encode(digest(raw_material, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chain_audit_hash ON tamper_proof_audit_ledger;
CREATE TRIGGER trg_chain_audit_hash
BEFORE INSERT ON tamper_proof_audit_ledger
FOR EACH ROW
EXECUTE FUNCTION chain_audit_hash();

-- Block UPDATE and DELETE on the tamper-proof audit ledger
CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY_VIOLATION: tamper_proof_audit_ledger is strictly append-only. Modifications are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ledger_mutation ON tamper_proof_audit_ledger;
CREATE TRIGGER trg_prevent_ledger_mutation
BEFORE UPDATE OR DELETE ON tamper_proof_audit_ledger
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_mutation();

-- 7. Seed Operational Units (Command HQ & Forward Operating Bases in EPSG:4326)
INSERT INTO units (unit_id, name, echelon_level, sector, geom)
VALUES
    ('UNIT-HQ-01', 'Northern Command HQ (Udhampur)', 'COMMAND_HQ', 'NORTHERN-COMMAND', ST_SetSRID(ST_MakePoint(75.1416, 32.9160), 4326)),
    ('UNIT-FOB-ALPHA', 'Forward Base Siachen-Alpha', 'FORWARD_BASE', 'LADAKH-SECTOR', ST_SetSRID(ST_MakePoint(77.1025, 35.4215), 4326)),
    ('UNIT-FOB-BRAVO', 'Forward Base Kargil-Bravo', 'FORWARD_BASE', 'DRASS-SECTOR', ST_SetSRID(ST_MakePoint(76.1349, 34.5539), 4326))
ON CONFLICT (unit_id) DO NOTHING;

-- 8. Seed Critical Munitions, Rations, and Cold-Weather Gear
INSERT INTO inventory_items (sku, item_name, category, unit_of_measure, critical_safety_threshold)
VALUES
    ('MUN-155MM-HE', '155mm High-Explosive Artillery Shell', 'MUNITIONS', 'ROUNDS', 500),
    ('MUN-762-NATO', '7.62x51mm NATO Ball Ammunition', 'MUNITIONS', 'CRATES', 300),
    ('RAT-MRE-HALT', 'High-Altitude Combat Ration Pack (3500 kcal)', 'RATIONS', 'PACKS', 1200),
    ('FUEL-JP8-ARC', 'JP-8 Arctic Grade Aviation/Convoy Fuel', 'POL', 'LITERS', 5000),
    ('MED-IFAK-TRAUMA', 'Combat Trauma & Hypothermia Kit', 'MEDICAL', 'KITS', 150)
ON CONFLICT (sku) DO NOTHING;

-- 9. Seed Initial Stock Levels
INSERT INTO unit_stocks (unit_id, sku, current_quantity, daily_burn_rate, last_sync_timestamp)
VALUES
    ('UNIT-HQ-01', 'MUN-155MM-HE', 2400, 45.0, NOW()),
    ('UNIT-HQ-01', 'RAT-MRE-HALT', 8500, 210.0, NOW()),
    ('UNIT-HQ-01', 'FUEL-JP8-ARC', 28000, 650.0, NOW()),
    ('UNIT-FOB-ALPHA', 'MUN-155MM-HE', 320, 65.0, NOW()),
    ('UNIT-FOB-ALPHA', 'RAT-MRE-HALT', 950, 180.0, NOW()),
    ('UNIT-FOB-ALPHA', 'FUEL-JP8-ARC', 3800, 520.0, NOW()),
    ('UNIT-FOB-BRAVO', 'MUN-762-NATO', 410, 35.0, NOW()),
    ('UNIT-FOB-BRAVO', 'MED-IFAK-TRAUMA', 95, 12.0, NOW())
ON CONFLICT (unit_id, sku) DO NOTHING;

-- 10. Seed Genesis Audit Record
INSERT INTO tamper_proof_audit_ledger (action, actor_id, payload_hash)
VALUES (
    'GENESIS_LEDGER_INIT',
    'SYSTEM_CRYPTO_BOOTSTRAP',
    encode(digest('SENA_AAPURTI_GENESIS_BLOCK_2026', 'sha256'), 'hex')
);
