-- ====================================================================
-- Project Prahari — Hazard Zone Seed Data (Phase 2)
-- Sample active hazard zones for NE India to populate the donut chart
-- ====================================================================

-- Flood zone: Brahmaputra flood plain around Guwahati
INSERT INTO hazard_zones (hazard_type, severity, title, description, geometry, radius_km, source, is_active, started_at)
VALUES (
    'FLOOD', 'HIGH',
    'Brahmaputra Flood Zone — Guwahati',
    'Active flooding along the Brahmaputra River near Guwahati. Water levels above danger mark at multiple stations.',
    ST_SetSRID(ST_Buffer(ST_MakePoint(91.7362, 26.1445)::geography, 25000)::geometry, 4326),
    25.0, 'CWC', TRUE, NOW() - INTERVAL '2 days'
);

-- Flood zone: Barak river basin flooding near Silchar
INSERT INTO hazard_zones (hazard_type, severity, title, description, geometry, radius_km, source, is_active, started_at)
VALUES (
    'FLOOD', 'CRITICAL',
    'Barak Basin Flood — Silchar',
    'Severe flooding in Silchar area. Barak river above danger level. Evacuation in progress.',
    ST_SetSRID(ST_Buffer(ST_MakePoint(92.7789, 24.8333)::geography, 15000)::geometry, 4326),
    15.0, 'CWC', TRUE, NOW() - INTERVAL '1 day'
);

-- Flood zone: Dibrugarh flooding
INSERT INTO hazard_zones (hazard_type, severity, title, description, geometry, radius_km, source, is_active, started_at)
VALUES (
    'FLOOD', 'HIGH',
    'Brahmaputra Flood — Dibrugarh',
    'Brahmaputra river above danger level at Dibrugarh. Low-lying areas inundated.',
    ST_SetSRID(ST_Buffer(ST_MakePoint(94.9120, 27.4728)::geography, 20000)::geometry, 4326),
    20.0, 'CWC', TRUE, NOW() - INTERVAL '12 hours'
);

-- Earthquake: Recent seismic event near Manipur
INSERT INTO hazard_zones (hazard_type, severity, title, description, geometry, radius_km, source, source_event_id, is_active, started_at)
VALUES (
    'EARTHQUAKE', 'MEDIUM',
    'M4.2 Earthquake — Imphal, Manipur',
    'Moderate earthquake detected near Imphal. Magnitude 4.2, depth 15km. No major damage reported.',
    ST_SetSRID(ST_Buffer(ST_MakePoint(93.9368, 24.8170)::geography, 30000)::geometry, 4326),
    30.0, 'USGS', 'us7000eq01', TRUE, NOW() - INTERVAL '6 hours'
);

-- Landslide: Meghalaya hills
INSERT INTO hazard_zones (hazard_type, severity, title, description, geometry, radius_km, source, is_active, started_at)
VALUES (
    'LANDSLIDE', 'HIGH',
    'Landslide Risk — East Khasi Hills',
    'Multiple landslides reported on NH-6 near Shillong. Road closures in effect. Heavy rainfall trigger.',
    ST_SetSRID(ST_Buffer(ST_MakePoint(91.8933, 25.5788)::geography, 10000)::geometry, 4326),
    10.0, 'NDMA', TRUE, NOW() - INTERVAL '8 hours'
);

-- Landslide: Arunachal Pradesh
INSERT INTO hazard_zones (hazard_type, severity, title, description, geometry, radius_km, source, is_active, started_at)
VALUES (
    'LANDSLIDE', 'MEDIUM',
    'Landslide Warning — Itanagar',
    'Landslide risk in Itanagar sector due to continuous heavy rainfall. Advisory issued for hilly areas.',
    ST_SetSRID(ST_Buffer(ST_MakePoint(93.6166, 27.0844)::geography, 12000)::geometry, 4326),
    12.0, 'IMD', TRUE, NOW() - INTERVAL '4 hours'
);

-- Air Quality: Guwahati poor AQI
INSERT INTO hazard_zones (hazard_type, severity, title, description, geometry, radius_km, source, is_active, started_at)
VALUES (
    'AIR_QUALITY', 'LOW',
    'Moderate AQI — Guwahati Urban',
    'Air quality index at 142 (Unhealthy for Sensitive Groups). PM2.5 dominant pollutant. Mask advisory in effect.',
    ST_SetSRID(ST_Buffer(ST_MakePoint(91.7362, 26.1445)::geography, 8000)::geometry, 4326),
    8.0, 'AQICN', TRUE, NOW() - INTERVAL '3 hours'
);
