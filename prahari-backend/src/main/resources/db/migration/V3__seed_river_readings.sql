-- ====================================================================
-- Project Prahari — River Readings Seed Data (Phase 2)
-- Sample time-series water level readings for all 15 river stations
-- ====================================================================
-- Mix of normal, warning-level, and danger-level readings to demonstrate
-- the bar chart color-coding and danger alert features.
-- ====================================================================

-- ====================================================================
-- Helper: Insert readings referencing stations by station_code
-- Each station gets 3-5 readings at different timestamps
-- ====================================================================

-- Guwahati (GWHT) — Brahmaputra — Near warning level
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'GWHT'), 47.50, 12500.0, 'RISING',  NOW() - INTERVAL '4 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'GWHT'), 47.90, 12800.0, 'RISING',  NOW() - INTERVAL '3 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'GWHT'), 48.30, 13100.0, 'RISING',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'GWHT'), 48.75, 13400.0, 'RISING',  NOW() - INTERVAL '1 hour',  FALSE, TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'GWHT'), 48.20, 13200.0, 'FALLING', NOW(),                       FALSE, FALSE);

-- Dibrugarh (DIBR) — Brahmaputra — Above danger level!
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'DIBR'), 103.00, 18200.0, 'RISING',  NOW() - INTERVAL '4 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'DIBR'), 103.50, 18600.0, 'RISING',  NOW() - INTERVAL '3 hours', FALSE, TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'DIBR'), 104.10, 19000.0, 'RISING',  NOW() - INTERVAL '2 hours', FALSE, TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'DIBR'), 104.50, 19400.0, 'RISING',  NOW() - INTERVAL '1 hour',  TRUE,  TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'DIBR'), 104.80, 19600.0, 'RISING',  NOW(),                       TRUE,  TRUE);

-- Neamatighat (NEAM) — Brahmaputra — Normal level
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'NEAM'), 58.20, 14200.0, 'STEADY',  NOW() - INTERVAL '3 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'NEAM'), 58.40, 14300.0, 'STEADY',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'NEAM'), 58.50, 14250.0, 'STEADY',  NOW() - INTERVAL '1 hour',  FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'NEAM'), 58.30, 14200.0, 'FALLING', NOW(),                       FALSE, FALSE);

-- Tezpur (TEZP) — Brahmaputra — Warning level
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'TEZP'), 63.50, 15100.0, 'RISING',  NOW() - INTERVAL '3 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'TEZP'), 64.00, 15500.0, 'RISING',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'TEZP'), 64.50, 15900.0, 'RISING',  NOW() - INTERVAL '1 hour',  FALSE, TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'TEZP'), 64.80, 16100.0, 'RISING',  NOW(),                       FALSE, TRUE);

-- Dhubri (DHBR) — Brahmaputra — Normal
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'DHBR'), 25.30, 11200.0, 'STEADY',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'DHBR'), 25.40, 11300.0, 'STEADY',  NOW() - INTERVAL '1 hour',  FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'DHBR'), 25.50, 11250.0, 'STEADY',  NOW(),                       FALSE, FALSE);

-- Jogighopa (JOGK) — Brahmaputra — Normal
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'JOGK'), 28.50, 10800.0, 'FALLING', NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'JOGK'), 28.30, 10600.0, 'FALLING', NOW() - INTERVAL '1 hour',  FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'JOGK'), 28.10, 10500.0, 'FALLING', NOW(),                       FALSE, FALSE);

-- Silchar (SILK) — Barak — Above danger level!
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'SILK'), 20.00, 4200.0, 'RISING',  NOW() - INTERVAL '4 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'SILK'), 20.80, 4600.0, 'RISING',  NOW() - INTERVAL '3 hours', FALSE, TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'SILK'), 21.30, 4900.0, 'RISING',  NOW() - INTERVAL '2 hours', FALSE, TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'SILK'), 21.70, 5100.0, 'RISING',  NOW() - INTERVAL '1 hour',  TRUE,  TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'SILK'), 21.90, 5200.0, 'RISING',  NOW(),                       TRUE,  TRUE);

-- Badarpurghat (BDRP) — Barak — Warning level
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'BDRP'), 13.80, 3100.0, 'RISING',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'BDRP'), 14.30, 3400.0, 'RISING',  NOW() - INTERVAL '1 hour',  FALSE, TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'BDRP'), 14.60, 3600.0, 'RISING',  NOW(),                       FALSE, TRUE);

-- Jorhat (JRHT) — Bhogdoi — Normal
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'JRHT'), 79.50, 2800.0, 'STEADY',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'JRHT'), 79.70, 2850.0, 'STEADY',  NOW() - INTERVAL '1 hour',  FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'JRHT'), 79.80, 2870.0, 'STEADY',  NOW(),                       FALSE, FALSE);

-- Doom Dooma (DOOM) — Burhi Dihing — Normal
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'DOOM'), 115.00, 3500.0, 'FALLING', NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'DOOM'), 114.80, 3400.0, 'FALLING', NOW() - INTERVAL '1 hour',  FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'DOOM'), 114.50, 3300.0, 'FALLING', NOW(),                       FALSE, FALSE);

-- Shillong (SHLL) — Umiam — Normal
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'SHLL'), 9.80, 850.0, 'STEADY',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'SHLL'), 9.90, 860.0, 'STEADY',  NOW() - INTERVAL '1 hour',  FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'SHLL'), 10.00, 870.0, 'STEADY',  NOW(),                       FALSE, FALSE);

-- Imphal (IMPL) — Imphal River — Normal
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'IMPL'), 778.50, 620.0, 'RISING',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'IMPL'), 779.00, 650.0, 'RISING',  NOW() - INTERVAL '1 hour',  FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'IMPL'), 779.50, 680.0, 'RISING',  NOW(),                       FALSE, FALSE);

-- Agartala (AGRT) — Haora — Warning level
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'AGRT'), 8.80, 420.0, 'RISING',  NOW() - INTERVAL '3 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'AGRT'), 9.20, 450.0, 'RISING',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'AGRT'), 9.60, 480.0, 'RISING',  NOW() - INTERVAL '1 hour',  FALSE, TRUE),
    ((SELECT id FROM river_stations WHERE station_code = 'AGRT'), 9.80, 500.0, 'RISING',  NOW(),                       FALSE, TRUE);

-- Kathmandu (KTMD) — Bagmati — Normal
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'KTMD'), 3.50, 180.0, 'STEADY',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'KTMD'), 3.60, 185.0, 'STEADY',  NOW() - INTERVAL '1 hour',  FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'KTMD'), 3.55, 182.0, 'STEADY',  NOW(),                       FALSE, FALSE);

-- Thimphu (THMP) — Wang Chu — Normal
INSERT INTO river_readings (station_id, water_level, flow_rate, trend, reading_time, is_above_danger, is_above_warning) VALUES
    ((SELECT id FROM river_stations WHERE station_code = 'THMP'), 5.80, 310.0, 'STEADY',  NOW() - INTERVAL '2 hours', FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'THMP'), 5.90, 315.0, 'STEADY',  NOW() - INTERVAL '1 hour',  FALSE, FALSE),
    ((SELECT id FROM river_stations WHERE station_code = 'THMP'), 5.85, 312.0, 'FALLING', NOW(),                       FALSE, FALSE);
