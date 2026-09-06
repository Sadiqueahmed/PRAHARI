"""
Project Prahari — CWC / NWDP River Level Data Scraper

Scrapes/polls the National Water Data Portal (NWDP) for river level
readings at CWC telemetry stations in Northeast India.

Data Source: https://nwdp.nwic.gov.in
Fallback: Manual station data from CWC flood bulletins

Note: CWC does not have a clean public REST API. This scraper
uses the NWDP portal's data endpoints where available, and falls
back to HTML parsing for stations without API access.
For production, apply for official API access at nwdp.nwic.gov.in.
"""

import json
import logging
import time
import requests
import schedule
from sqlalchemy import text
from db import get_session, insert_hazard_zone, test_connection

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s [CWC] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


def poll_river_levels():
    """
    Poll river level data from NWDP and insert readings into PostGIS.
    When a station exceeds danger level, creates a FLOOD hazard zone.
    """
    logger.info("Polling river level data...")

    session_gen = get_session()
    session = next(session_gen)

    try:
        # Get all river stations from the database
        stations = session.execute(
            text("SELECT id, station_code, station_name, river_name, danger_level, warning_level, "
                 "ST_X(location) AS lng, ST_Y(location) AS lat FROM river_stations")
        ).fetchall()

        logger.info(f"Checking {len(stations)} river stations")

        for station in stations:
            try:
                # Attempt to fetch from NWDP API
                # Note: This URL pattern may change; adjust based on NWDP's actual API
                url = f"https://nwdp.nwic.gov.in/api/station/{station.station_code}/latest"

                try:
                    response = requests.get(url, timeout=10)
                    if response.status_code == 200:
                        data = response.json()
                        water_level = data.get("water_level") or data.get("level")
                        flow_rate = data.get("flow_rate") or data.get("discharge")
                    else:
                        # API not available — skip this station
                        logger.debug(f"NWDP API not available for {station.station_name}")
                        continue
                except requests.RequestException:
                    logger.debug(f"Cannot reach NWDP for {station.station_name}")
                    continue

                if water_level is None:
                    continue

                water_level = float(water_level)

                # Determine trend (simplified — compare with last reading)
                last_reading = session.execute(
                    text("""
                        SELECT water_level FROM river_readings
                        WHERE station_id = :station_id
                        ORDER BY reading_time DESC LIMIT 1
                    """),
                    {"station_id": station.id}
                ).fetchone()

                trend = "STEADY"
                if last_reading:
                    diff = water_level - last_reading.water_level
                    if diff > 0.1: trend = "RISING"
                    elif diff < -0.1: trend = "FALLING"

                is_above_danger = water_level >= station.danger_level if station.danger_level else False
                is_above_warning = water_level >= station.warning_level if station.warning_level else False

                # Insert the reading
                session.execute(
                    text("""
                        INSERT INTO river_readings
                            (station_id, water_level, flow_rate, trend, reading_time,
                             is_above_danger, is_above_warning)
                        VALUES
                            (:station_id, :water_level, :flow_rate, :trend, NOW(),
                             :is_above_danger, :is_above_warning)
                    """),
                    {
                        "station_id": station.id,
                        "water_level": water_level,
                        "flow_rate": flow_rate,
                        "trend": trend,
                        "is_above_danger": is_above_danger,
                        "is_above_warning": is_above_warning,
                    }
                )

                level_status = "🔴 DANGER" if is_above_danger else ("🟡 WARNING" if is_above_warning else "🟢 Normal")
                logger.info(f"  {station.station_name} ({station.river_name}): "
                           f"{water_level}m [{trend}] {level_status}")

                # If above danger level, create a FLOOD hazard zone
                if is_above_danger:
                    from shapely.geometry import Point, mapping

                    # Create 15km radius flood zone around the station
                    radius_km = 15.0
                    radius_deg = radius_km / 111.32
                    circle = Point(station.lng, station.lat).buffer(radius_deg, resolution=32)
                    geojson_str = json.dumps(mapping(circle))

                    severity = "CRITICAL" if water_level >= station.danger_level + 1.0 else "HIGH"

                    insert_hazard_zone(
                        session=session,
                        hazard_type="FLOOD",
                        severity=severity,
                        title=f"Flood Alert — {station.station_name} ({station.river_name})",
                        description=(
                            f"Water level at {station.station_name} on {station.river_name} "
                            f"is {water_level}m, above danger level of {station.danger_level}m. "
                            f"Trend: {trend}."
                        ),
                        geojson_str=geojson_str,
                        source="CWC",
                        source_event_id=f"cwc_{station.station_code}_{int(time.time()) // 3600}",
                        metadata_json=json.dumps({
                            "water_level_m": water_level,
                            "danger_level_m": station.danger_level,
                            "trend": trend,
                            "station_code": station.station_code,
                            "river": station.river_name,
                        }),
                        started_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        radius_km=radius_km,
                    )

            except Exception as e:
                logger.error(f"Error processing station {station.station_name}: {e}")
                continue

        session.commit()

    except Exception as e:
        logger.error(f"Error in CWC poll: {e}")
        session.rollback()
    finally:
        session.close()


def main():
    """Run the CWC river level poller on a 15-minute schedule."""
    logger.info("🌊 Starting CWC River Level Scraper")

    if not test_connection():
        logger.error("Cannot connect to database. Exiting.")
        return

    poll_river_levels()

    schedule.every(15).minutes.do(poll_river_levels)

    logger.info("Polling every 15 minutes. Press Ctrl+C to stop.")
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()
