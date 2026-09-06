"""
Project Prahari — AQICN Air Quality Poller

Polls the World Air Quality Index (AQICN) API every 30 minutes for
air quality data at key monitoring stations in Northeast India.

Data Source: https://aqicn.org/json-api/doc/
Endpoint: https://api.waqi.info/feed/geo:{lat};{lng}/?token={token}
"""

import json
import logging
import time
import requests
import schedule
from sqlalchemy import text
from db import get_session, test_connection
from config import config

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s [AQICN] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

AQICN_BASE_URL = "https://api.waqi.info"

# Key monitoring stations in NE India
MONITORING_STATIONS = [
    {"name": "Guwahati", "lat": 26.1445, "lng": 91.7362},
    {"name": "Shillong", "lat": 25.5788, "lng": 91.8933},
    {"name": "Dibrugarh", "lat": 27.4728, "lng": 94.9120},
    {"name": "Imphal", "lat": 24.8170, "lng": 93.9368},
    {"name": "Agartala", "lat": 23.8315, "lng": 91.2868},
    {"name": "Silchar", "lat": 24.8333, "lng": 92.7789},
    {"name": "Kathmandu", "lat": 27.7172, "lng": 85.3240},
    {"name": "Thimphu", "lat": 27.4728, "lng": 89.6386},
]


def aqi_to_severity(aqi):
    """Convert AQI value to Prahari severity level."""
    if aqi > 300: return "CRITICAL"
    if aqi > 200: return "HIGH"
    if aqi > 150: return "MEDIUM"
    return "LOW"


def poll_aqicn():
    """Poll AQICN API for each monitoring station."""
    if not config.AQICN_API_TOKEN:
        logger.warning("AQICN_API_TOKEN not set — skipping poll")
        return

    logger.info("Polling AQICN for %d stations...", len(MONITORING_STATIONS))

    session_gen = get_session()
    session = next(session_gen)

    try:
        for station in MONITORING_STATIONS:
            try:
                url = f"{AQICN_BASE_URL}/feed/geo:{station['lat']};{station['lng']}/"
                response = requests.get(url, params={"token": config.AQICN_API_TOKEN}, timeout=15)
                response.raise_for_status()
                data = response.json()

                if data.get("status") != "ok":
                    logger.warning(f"AQICN returned non-ok status for {station['name']}")
                    continue

                aq_data = data.get("data", {})
                aqi = aq_data.get("aqi")

                if aqi is None or not isinstance(aqi, (int, float)):
                    logger.warning(f"No AQI data for {station['name']}")
                    continue

                aqi = int(aqi)

                # Extract pollutant data
                iaqi = aq_data.get("iaqi", {})
                pm25 = iaqi.get("pm25", {}).get("v")
                pm10 = iaqi.get("pm10", {}).get("v")
                o3 = iaqi.get("o3", {}).get("v")
                no2 = iaqi.get("no2", {}).get("v")
                co = iaqi.get("co", {}).get("v")
                so2 = iaqi.get("so2", {}).get("v")
                dominant = aq_data.get("dominentpol", "PM2.5")

                # Insert reading
                session.execute(
                    text("""
                        INSERT INTO air_quality_readings
                            (station_name, location, aqi, dominant_pollutant,
                             pm25, pm10, o3, no2, co, so2, reading_time)
                        VALUES
                            (:station, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326),
                             :aqi, :dominant, :pm25, :pm10, :o3, :no2, :co, :so2, NOW())
                    """),
                    {
                        "station": station["name"],
                        "lng": station["lng"], "lat": station["lat"],
                        "aqi": aqi, "dominant": dominant,
                        "pm25": pm25, "pm10": pm10, "o3": o3,
                        "no2": no2, "co": co, "so2": so2,
                    }
                )

                logger.info(f"  {station['name']}: AQI={aqi} ({dominant})")

                # If AQI > 150, create a hazard zone
                if aqi > 150:
                    from db import insert_hazard_zone
                    from shapely.geometry import Point, mapping

                    # Create 10km radius zone around station
                    radius_deg = 10.0 / 111.32
                    circle = Point(station["lng"], station["lat"]).buffer(radius_deg, resolution=32)
                    geojson_str = json.dumps(mapping(circle))

                    insert_hazard_zone(
                        session=session,
                        hazard_type="AIR_QUALITY",
                        severity=aqi_to_severity(aqi),
                        title=f"Poor Air Quality — {station['name']} (AQI {aqi})",
                        description=f"Air quality index at {station['name']} is {aqi}. Dominant pollutant: {dominant}",
                        geojson_str=geojson_str,
                        source="AQICN",
                        source_event_id=f"aqicn_{station['name'].lower()}_{int(time.time()) // 3600}",
                        metadata_json=json.dumps({"aqi": aqi, "dominant_pollutant": dominant,
                                                   "pm25": pm25, "pm10": pm10}),
                        started_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        radius_km=10.0,
                    )

            except requests.RequestException as e:
                logger.error(f"Failed to fetch data for {station['name']}: {e}")
                continue

        session.commit()

    except Exception as e:
        logger.error(f"Error in AQICN poll: {e}")
        session.rollback()
    finally:
        session.close()


def main():
    """Run the AQICN poller on a 30-minute schedule."""
    logger.info("🌫️ Starting AQICN Air Quality Poller")

    if not test_connection():
        logger.error("Cannot connect to database. Exiting.")
        return

    poll_aqicn()

    schedule.every(30).minutes.do(poll_aqicn)

    logger.info("Polling every 30 minutes. Press Ctrl+C to stop.")
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()
