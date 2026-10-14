import psycopg2
from app.core.config import settings

db_url = settings.DATABASE_URL.replace('+psycopg2', '')
conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

# Try enabling pgcrypto
cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
print("pgcrypto extension enabled!")

# Create compatibility types and functions if PostGIS is not installed
cur.execute("""
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geometry') THEN
        CREATE DOMAIN GEOMETRY AS text;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION ST_MakePoint(x double precision, y double precision)
RETURNS text AS $$
    SELECT x::text || ',' || y::text;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION ST_SetSRID(geom text, srid integer)
RETURNS text AS $$
    SELECT geom;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION ST_X(geom text)
RETURNS double precision AS $$
    SELECT CASE 
        WHEN geom IS NULL OR geom = '' THEN 0.0
        ELSE split_part(geom, ',', 1)::double precision
    END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION ST_Y(geom text)
RETURNS double precision AS $$
    SELECT CASE 
        WHEN geom IS NULL OR geom = '' THEN 0.0
        ELSE split_part(geom, ',', 2)::double precision
    END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION ST_GeomFromEWKT(ewkt text)
RETURNS text AS $$
    SELECT ewkt;
$$ LANGUAGE sql IMMUTABLE;
""")
print("Spatial compatibility functions created!")

# Now create core operational tables
cur.execute("""
CREATE TABLE IF NOT EXISTS units (
    unit_id VARCHAR(48) PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    echelon_level VARCHAR(64) NOT NULL,
    sector VARCHAR(64) NOT NULL DEFAULT 'NORTHERN-COMMAND',
    geom TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS nodes (
    node_id VARCHAR(48) PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    echelon VARCHAR(64) NOT NULL,
    sector VARCHAR(64) NOT NULL DEFAULT 'NORTHERN-COMMAND',
    elevation_m INTEGER NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    geom TEXT NOT NULL,
    storage_capacity_tons DOUBLE PRECISION NOT NULL,
    baseline_troop_strength INTEGER NOT NULL DEFAULT 1000
);

CREATE TABLE IF NOT EXISTS routes (
    route_id VARCHAR(48) PRIMARY KEY,
    origin_id VARCHAR(48) NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
    destination_id VARCHAR(48) NOT NULL REFERENCES nodes(node_id) ON DELETE CASCADE,
    distance_km DOUBLE PRECISION NOT NULL,
    terrain_type VARCHAR(64) NOT NULL,
    seasonal_pass_name VARCHAR(96),
    default_lead_time_hrs DOUBLE PRECISION NOT NULL,
    geom TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS transit_missions (
    mission_id VARCHAR(64) PRIMARY KEY,
    route_id VARCHAR(48),
    origin_id VARCHAR(48),
    destination_id VARCHAR(48),
    vehicle_type VARCHAR(48) NOT NULL,
    cargo_manifest JSONB NOT NULL,
    route_status VARCHAR(32) NOT NULL,
    delay_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    departure_time TIMESTAMPTZ NOT NULL,
    eta TIMESTAMPTZ NOT NULL
);

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

-- Strategic Alerts & Remediation Action Table
CREATE TABLE IF NOT EXISTS strategic_alerts (
    alert_id VARCHAR(48) PRIMARY KEY,
    theater VARCHAR(64) NOT NULL,
    sector VARCHAR(96) NOT NULL,
    alert_type VARCHAR(48) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    headline VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    affected_unit VARCHAR(96) NOT NULL,
    affected_supply VARCHAR(128) NOT NULL,
    recommended_action TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTION_REQUIRED',
    authorized_by VARCHAR(64),
    authorized_at TIMESTAMPTZ,
    tx_hash VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cryptographic Audit Ledger
CREATE TABLE IF NOT EXISTS tamper_proof_audit_ledger (
    log_id BIGSERIAL PRIMARY KEY,
    previous_hash CHAR(64) NOT NULL,
    current_hash CHAR(64) NOT NULL UNIQUE,
    action VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64) NOT NULL,
    payload_hash CHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp()
);

-- Chaining trigger
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
""")
print("Tables and triggers created!")

# Seed base data
cur.execute("""
INSERT INTO units (unit_id, name, echelon_level, sector, geom)
VALUES
    ('UNIT-HQ-01', 'Northern Command HQ (Udhampur)', 'COMMAND_HQ', 'NORTHERN-COMMAND', ST_SetSRID(ST_MakePoint(75.1416, 32.9160), 4326)),
    ('UNIT-FOB-ALPHA', 'Forward Base Siachen-Alpha', 'FORWARD_BASE', 'LADAKH-SECTOR', ST_SetSRID(ST_MakePoint(77.1025, 35.4215), 4326)),
    ('UNIT-FOB-BRAVO', 'Forward Base Kargil-Bravo', 'FORWARD_BASE', 'DRASS-SECTOR', ST_SetSRID(ST_MakePoint(76.1349, 34.5539), 4326)),
    ('UNIT-14RM-LEH', '14 RAJPUT (MECHANISED)', 'BATTALION', 'LADAKH-SECTOR', ST_SetSRID(ST_MakePoint(77.5771, 34.1526), 4326)),
    ('UNIT-3PARA-SF', '3 PARA (SPECIAL FORCES)', 'BATTALION', 'LADAKH-SECTOR', ST_SetSRID(ST_MakePoint(77.2000, 34.3000), 4326)),
    ('UNIT-8GARH-TWG', '8 GARHWAL RIFLES', 'BATTALION', 'TAWANG-SECTOR', ST_SetSRID(ST_MakePoint(91.8594, 27.5861), 4326)),
    ('UNIT-2ARM-POK', '2 ARMOURED REGIMENT', 'REGIMENT', 'DESERT-SECTOR', ST_SetSRID(ST_MakePoint(71.7500, 26.9000), 4326)),
    ('UNIT-19ART-ZOJ', '19 ARTILLERY REGIMENT', 'REGIMENT', 'ZOJILA-SECTOR', ST_SetSRID(ST_MakePoint(75.4800, 34.2800), 4326))
ON CONFLICT (unit_id) DO NOTHING;

INSERT INTO inventory_items (sku, item_name, category, unit_of_measure, critical_safety_threshold)
VALUES
    ('MUN-155MM-HE', '155mm High-Explosive Artillery Shell', 'MUNITIONS', 'ROUNDS', 500),
    ('MUN-762-NATO', '7.62x51mm NATO Ball Ammunition', 'MUNITIONS', 'CRATES', 300),
    ('RAT-MRE-HALT', 'High-Altitude Combat Ration Pack (3500 kcal)', 'RATIONS', 'PACKS', 1200),
    ('FUEL-JP8-ARC', 'JP-8 Arctic Grade Aviation/Convoy Fuel', 'POL', 'LITERS', 5000),
    ('MED-IFAK-TRAUMA', 'Combat Trauma & Hypothermia Kit', 'MEDICAL', 'KITS', 150),
    ('SPR-T90-FLT', 'T-90 Tank High-Dust Air Filtration Spares', 'SPARES', 'UNITS', 50),
    ('ECC-GLACIER-ST', 'Extreme Cold Climate Multilayer Suits', 'SPECIAL', 'SUITS', 200)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO unit_stocks (unit_id, sku, current_quantity, daily_burn_rate, last_sync_timestamp)
VALUES
    ('UNIT-HQ-01', 'MUN-155MM-HE', 2400, 45.0, NOW()),
    ('UNIT-HQ-01', 'RAT-MRE-HALT', 8500, 210.0, NOW()),
    ('UNIT-HQ-01', 'FUEL-JP8-ARC', 28000, 650.0, NOW()),
    ('UNIT-FOB-ALPHA', 'MUN-155MM-HE', 320, 65.0, NOW()),
    ('UNIT-FOB-ALPHA', 'RAT-MRE-HALT', 950, 180.0, NOW()),
    ('UNIT-FOB-ALPHA', 'FUEL-JP8-ARC', 3800, 520.0, NOW()),
    ('UNIT-FOB-BRAVO', 'MUN-762-NATO', 410, 35.0, NOW()),
    ('UNIT-FOB-BRAVO', 'MED-IFAK-TRAUMA', 95, 12.0, NOW()),
    ('UNIT-14RM-LEH', 'FUEL-JP8-ARC', 16200, 320.0, NOW()),
    ('UNIT-2ARM-POK', 'SPR-T90-FLT', 28, 6.0, NOW())
ON CONFLICT (unit_id, sku) DO NOTHING;

-- Seed Genesis block if empty
INSERT INTO tamper_proof_audit_ledger (action, actor_id, payload_hash)
SELECT 'GENESIS_LEDGER_INIT', 'SYSTEM_CRYPTO_BOOTSTRAP', encode(digest('SENA_AAPURTI_GENESIS_BLOCK_2026', 'sha256'), 'hex')
WHERE NOT EXISTS (SELECT 1 FROM tamper_proof_audit_ledger);

-- Seed initial Strategic Alerts
INSERT INTO strategic_alerts (alert_id, theater, sector, alert_type, severity, headline, details, affected_unit, affected_supply, recommended_action, status)
VALUES
    ('ALT-881', 'Northern Command', 'Ladakh - Siachen Axis', 'Weather Risk', 'Critical',
     'Severe Cold Wave Forecast (-34°C) along Siachen - DBO Highway',
     'Satellite radar indicates 140 km/h blizzard winds starting in 36 hours. Road transit over Khardung La will be closed for at least 48 hours.',
     '3 PARA (SF) & 14 RAJPUT', 'Class III Winter Sub-Zero POL & Fresh Medical Plasma',
     'Preposition 18,000L sub-zero POL and 300 emergency medical plasma packs to Partapur & Shyok forward nodes via Convoy GARUDA-01 immediately.',
     'ACTION_REQUIRED'),
    ('ALT-882', 'Eastern Command', 'Tawang Sector (Arunachal)', 'Demand Surge', 'High',
     'Predicted 28% Surge in Class I Rations & Winter Heating Fuel',
     'AI consumption prediction models detect early onset of mountain frost and deployment expansion along LAC border pickets.',
     '8 GARHWAL RIFLES', 'Class I Rations & Kerosene Fuel',
     'Augment Narangi-Tawang convoy frequency from bi-weekly to tri-weekly. Dispatch additional 40 tonnes dry rations.',
     'ACTION_REQUIRED'),
    ('ALT-883', 'Western Command', 'Desert Sector (Rajasthan)', 'Stock Critical', 'Medium',
     'T-90 Tank Air Filtration Spares Reached Re-Order Threshold',
     'Intense sandstorm operations accelerated filtration element wear to 84% of monthly buffer at 2 Armoured Regiment.',
     '2 ARMOURED REGIMENT', 'Class IX T-90 High-Dust Filtration Assemblies',
     'Trigger automatic release order from COD Jabalpur for 120 filter assemblies via Convoy CHETAK-2.',
     'ACTION_REQUIRED'),
    ('ALT-884', 'Northern Command', 'Zojila Axis', 'Route Disruption', 'High',
     'Zojila Pass Upper Sector Landslide Hazard Triggered',
     'Convoy HIMALAYA-9 encountered fresh rockfall and icing at Km 84. Upper axis temporarily restricted.',
     '19 ARTILLERY REGIMENT', 'Class V Munitions & Winter Buffer',
     'Activate BRO Secondary Tunnel Bypass at Nilgrath. Re-route 34 vehicles with military police escort.',
     'ACTION_REQUIRED')
ON CONFLICT (alert_id) DO NOTHING;
""")
print("Seed data populated successfully!")
conn.close()
