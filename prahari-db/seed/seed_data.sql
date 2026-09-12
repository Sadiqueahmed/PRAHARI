-- ====================================================================
-- Project Prahari — Seed Data
-- Sample data for development and testing
-- ====================================================================
-- Includes:
--   - RBAC roles
--   - NE India river monitoring stations (real CWC stations)
--   - Sample users across all roles
--   - Sample relief camps
-- ====================================================================

-- ====================================================================
-- 1. ROLES — Insert the RBAC hierarchy
-- ====================================================================
INSERT INTO roles (name, description) VALUES
    ('CITIZEN',     'General public user. Access to SOS, safe routes, emergency alerts.'),
    ('NGO',         'NGO worker. Access to logistics, inventory matching, relief camp management.'),
    ('GOVERNMENT',  'Government official. Access to command view, SOS heatmaps, predictive models.'),
    ('SUPER_ADMIN', 'Platform administrator. Full access to all features, user management, system config.')
ON CONFLICT (name) DO NOTHING;

-- ====================================================================
-- 2. SAMPLE USERS — One per role for testing
-- Password for all: "prahari123" (bcrypt hash)
-- ====================================================================
INSERT INTO users (email, password_hash, full_name, phone, whatsapp_id, role_id, location, organization) VALUES
    -- Citizen in Guwahati, Assam
    (
        'citizen@prahari.dev',
        '$2b$10$iqgMX8SPE6kdF6pLNaMsPeKPSmKWSflHJQHnxPzbGcLwNT5oiIWJ.',
        'Rina Kalita',
        '+919876543210',
        '919876543210',
        'CITIZEN',
        ST_SetSRID(ST_MakePoint(91.7362, 26.1445), 4326),
        NULL
    ),
    -- NGO worker in Dibrugarh, Assam
    (
        'ngo@prahari.dev',
        '$2b$10$iqgMX8SPE6kdF6pLNaMsPeKPSmKWSflHJQHnxPzbGcLwNT5oiIWJ.',
        'Bhaskar Gogoi',
        '+919876543211',
        '919876543211',
        'NGO',
        ST_SetSRID(ST_MakePoint(94.9120, 27.4728), 4326),
        'Assam Flood Relief Foundation'
    ),
    -- Government official in Shillong, Meghalaya
    (
        'govt@prahari.dev',
        '$2b$10$iqgMX8SPE6kdF6pLNaMsPeKPSmKWSflHJQHnxPzbGcLwNT5oiIWJ.',
        'Dr. David Lyngdoh',
        '+919876543212',
        '919876543212',
        'GOVERNMENT',
        ST_SetSRID(ST_MakePoint(91.8933, 25.5788), 4326),
        'NDMA - Northeast Division'
    ),
    -- Super Admin
    (
        'admin@prahari.dev',
        '$2b$10$iqgMX8SPE6kdF6pLNaMsPeKPSmKWSflHJQHnxPzbGcLwNT5oiIWJ.',
        'System Administrator',
        '+919876543200',
        '919876543200',
        'SUPER_ADMIN',
        ST_SetSRID(ST_MakePoint(91.7362, 26.1445), 4326),
        'Prahari Platform'
    )
ON CONFLICT (email) DO NOTHING;

-- ====================================================================
-- 3. RIVER STATIONS — Real CWC monitoring stations in NE India
-- These are actual gauging sites on major NE India rivers.
-- Danger and warning levels are approximate based on CWC data.
-- ====================================================================
INSERT INTO river_stations (station_code, station_name, river_name, basin, state, location, danger_level, warning_level, highest_flood_level) VALUES
    -- Brahmaputra River stations
    ('GWHT', 'Guwahati',        'Brahmaputra', 'Brahmaputra', 'Assam',
     ST_SetSRID(ST_MakePoint(91.7362, 26.1445), 4326), 49.68, 48.68, 51.44),

    ('DIBR', 'Dibrugarh',       'Brahmaputra', 'Brahmaputra', 'Assam',
     ST_SetSRID(ST_MakePoint(94.9120, 27.4728), 4326), 104.24, 103.24, 106.22),

    ('NEAM', 'Neamatighat',     'Brahmaputra', 'Brahmaputra', 'Assam',
     ST_SetSRID(ST_MakePoint(93.8900, 26.9800), 4326), 62.50, 61.50, 64.10),

    ('TEZP', 'Tezpur',          'Brahmaputra', 'Brahmaputra', 'Assam',
     ST_SetSRID(ST_MakePoint(92.7926, 26.6338), 4326), 65.35, 64.35, 67.21),

    ('DHBR', 'Dhubri',          'Brahmaputra', 'Brahmaputra', 'Assam',
     ST_SetSRID(ST_MakePoint(89.9860, 26.0200), 4326), 28.66, 27.66, 30.52),

    ('JOGK', 'Jogighopa',       'Brahmaputra', 'Brahmaputra', 'Assam',
     ST_SetSRID(ST_MakePoint(90.5700, 26.2200), 4326), 31.45, 30.45, 33.10),

    -- Barak River stations (Southern Assam)
    ('SILK', 'Silchar',         'Barak',       'Barak',       'Assam',
     ST_SetSRID(ST_MakePoint(92.7789, 24.8333), 4326), 21.50, 20.50, 23.15),

    ('BDRP', 'Badarpurghat',    'Barak',       'Barak',       'Assam',
     ST_SetSRID(ST_MakePoint(92.5946, 24.8683), 4326), 15.20, 14.20, 17.05),

    -- Tributary stations
    ('JRHT', 'Jorhat',          'Bhogdoi',     'Brahmaputra', 'Assam',
     ST_SetSRID(ST_MakePoint(94.2263, 26.7465), 4326), 82.60, 81.60, 84.30),

    ('DOOM', 'Doom Dooma',      'Burhi Dihing','Brahmaputra', 'Assam',
     ST_SetSRID(ST_MakePoint(95.5574, 27.5679), 4326), 118.50, 117.50, 120.10),

    -- Meghalaya
    ('SHLL', 'Shillong (Umiam)','Umiam',       'Brahmaputra', 'Meghalaya',
     ST_SetSRID(ST_MakePoint(91.8933, 25.5788), 4326), 12.00, 11.00, 14.50),

    -- Manipur
    ('IMPL', 'Imphal',          'Imphal',      'Barak',       'Manipur',
     ST_SetSRID(ST_MakePoint(93.9368, 24.8170), 4326), 781.50, 780.50, 783.20),

    -- Tripura
    ('AGRT', 'Agartala',        'Haora',       'Meghna',      'Tripura',
     ST_SetSRID(ST_MakePoint(91.2868, 23.8315), 4326), 10.50, 9.50, 12.30),

    -- Nepal (cross-border monitoring)
    ('KTMD', 'Kathmandu (Bagmati)', 'Bagmati', 'Ganges',      'Nepal',
     ST_SetSRID(ST_MakePoint(85.3240, 27.7172), 4326), 5.50, 4.50, 7.20),

    -- Bhutan
    ('THMP', 'Thimphu (Wang Chu)', 'Wang Chu',  'Brahmaputra', 'Bhutan',
     ST_SetSRID(ST_MakePoint(89.6386, 27.4728), 4326), 8.00, 7.00, 10.50)
ON CONFLICT (station_code) DO NOTHING;

-- ====================================================================
-- 4. SAMPLE RELIEF CAMPS — NE India
-- ====================================================================
INSERT INTO relief_camps (name, location, address, capacity, current_occupancy, is_active) VALUES
    (
        'Sarusajai Stadium Relief Center',
        ST_SetSRID(ST_MakePoint(91.7800, 26.1300), 4326),
        'Sarusajai Sports Complex, Guwahati, Assam 781040',
        5000, 1200, TRUE
    ),
    (
        'Dibrugarh University Flood Shelter',
        ST_SetSRID(ST_MakePoint(94.9000, 27.4800), 4326),
        'Dibrugarh University Campus, Dibrugarh, Assam 786004',
        2000, 450, TRUE
    ),
    (
        'Silchar Town Hall Relief Camp',
        ST_SetSRID(ST_MakePoint(92.7900, 24.8400), 4326),
        'Town Hall, Silchar, Cachar, Assam 788001',
        1500, 800, TRUE
    ),
    (
        'Jorhat District Emergency Shelter',
        ST_SetSRID(ST_MakePoint(94.2100, 26.7500), 4326),
        'Jorhat Government School Complex, Jorhat, Assam 785001',
        1000, 200, TRUE
    );

-- ====================================================================
-- 5. SAMPLE INVENTORY — For the Sarusajai relief camp
-- ====================================================================
INSERT INTO inventory_items (camp_id, item_name, category, quantity, unit, minimum_required) VALUES
    (
        (SELECT id FROM relief_camps WHERE name = 'Sarusajai Stadium Relief Center'),
        'Rice (25kg bags)', 'FOOD', 500, 'bags', 800
    ),
    (
        (SELECT id FROM relief_camps WHERE name = 'Sarusajai Stadium Relief Center'),
        'Drinking Water (20L cans)', 'WATER', 1200, 'cans', 1000
    ),
    (
        (SELECT id FROM relief_camps WHERE name = 'Sarusajai Stadium Relief Center'),
        'First Aid Kits', 'MEDICAL', 50, 'units', 100
    ),
    (
        (SELECT id FROM relief_camps WHERE name = 'Sarusajai Stadium Relief Center'),
        'Tarpaulin Sheets', 'SHELTER', 200, 'units', 500
    ),
    (
        (SELECT id FROM relief_camps WHERE name = 'Sarusajai Stadium Relief Center'),
        'Blankets', 'CLOTHING', 800, 'units', 1000
    ),
    (
        (SELECT id FROM relief_camps WHERE name = 'Sarusajai Stadium Relief Center'),
        'Hygiene Kits', 'HYGIENE', 150, 'units', 400
    );
