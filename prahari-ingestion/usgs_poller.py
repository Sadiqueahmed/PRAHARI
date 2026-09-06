"""
Project Prahari — USGS Earthquake GeoJSON Feed Poller

Polls the USGS Earthquake API every 5 minutes for significant earthquakes
in the South/Southeast Asia region. Converts earthquake events into
hazard zone polygons (circular buffers based on magnitude).

Data Source: https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php
Feed Used: M2.5+ earthquakes in the past day

Magnitude → Radius mapping:
  2.5-3.9: 10km  (felt locally)
  4.0-4.9: 25km  (light damage)
  5.0-5.9: 50km  (moderate damage)
  6.0-6.9: 100km (strong)
  7.0+:    200km (major/great)
"""

import json
import logging
import time
import requests
import schedule
from shapely.geometry import Point, mapping
from db import get_session, insert_hazard_zone, test_connection

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s [USGS] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# USGS GeoJSON feed — M2.5+ earthquakes in the past day
USGS_FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"

# Bounding box for NE India / Nepal / Bhutan / Tibet region
# [min_lon, min_lat, max_lon, max_lat]
REGION_BBOX = {
    "min_lon": 83.0,   # Western Nepal
    "max_lon": 98.0,   # Eastern Myanmar border
    "min_lat": 20.0,   # Southern Bangladesh
    "max_lat": 32.0,   # Northern Tibet
}


def magnitude_to_radius_km(magnitude):
    """Convert earthquake magnitude to impact radius in kilometers."""
    if magnitude >= 7.0: return 200.0
    if magnitude >= 6.0: return 100.0
    if magnitude >= 5.0: return 50.0
    if magnitude >= 4.0: return 25.0
    return 10.0


def magnitude_to_severity(magnitude):
    """Convert earthquake magnitude to Prahari severity level."""
    if magnitude >= 7.0: return "CRITICAL"
    if magnitude >= 6.0: return "HIGH"
    if magnitude >= 5.0: return "MEDIUM"
    return "LOW"


def create_circle_geojson(lon, lat, radius_km, num_points=64):
    """
    Create a circular polygon GeoJSON from center point and radius.
    Uses Shapely's buffer on a Point geometry.
    Note: This is an approximation using degrees; for production,
    the PostGIS function create_circle_zone() is more accurate.
    """
    radius_degrees = radius_km / 111.32  # Approximate conversion
    circle = Point(lon, lat).buffer(radius_degrees, resolution=num_points)
    return json.dumps(mapping(circle))


def poll_usgs():
    """
    Poll the USGS earthquake feed and insert relevant events into PostGIS.
    Filters for earthquakes within the NE India / Nepal / Bhutan / Tibet region.
    """
    logger.info("Polling USGS earthquake feed...")

    try:
        response = requests.get(USGS_FEED_URL, timeout=30)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as e:
        logger.error(f"Failed to fetch USGS data: {e}")
        return

    features = data.get("features", [])
    logger.info(f"Received {len(features)} earthquake events globally")

    # Filter for events in our region
    regional_events = []
    for feature in features:
        coords = feature["geometry"]["coordinates"]
        lon, lat = coords[0], coords[1]

        if (REGION_BBOX["min_lon"] <= lon <= REGION_BBOX["max_lon"] and
                REGION_BBOX["min_lat"] <= lat <= REGION_BBOX["max_lat"]):
            regional_events.append(feature)

    logger.info(f"Found {len(regional_events)} events in NE India / Nepal / Bhutan / Tibet region")

    if not regional_events:
        return

    # Insert each regional earthquake as a hazard zone
    session_gen = get_session()
    session = next(session_gen)

    try:
        for feature in regional_events:
            props = feature["properties"]
            coords = feature["geometry"]["coordinates"]
            lon, lat, depth = coords[0], coords[1], coords[2]

            magnitude = props.get("mag", 0)
            event_id = feature.get("id", props.get("code", ""))
            place = props.get("place", "Unknown location")
            event_time = props.get("time", 0)  # Unix timestamp in ms

            radius_km = magnitude_to_radius_km(magnitude)
            severity = magnitude_to_severity(magnitude)

            # Create circular buffer polygon
            geojson_str = create_circle_geojson(lon, lat, radius_km)

            # Metadata
            metadata = json.dumps({
                "magnitude": magnitude,
                "depth_km": depth,
                "place": place,
                "felt": props.get("felt"),
                "tsunami": props.get("tsunami"),
                "usgs_url": props.get("url"),
            })

            # Convert USGS timestamp (ms) to ISO 8601
            from datetime import datetime, timezone
            started_at = datetime.fromtimestamp(
                event_time / 1000, tz=timezone.utc
            ).isoformat()

            insert_hazard_zone(
                session=session,
                hazard_type="EARTHQUAKE",
                severity=severity,
                title=f"M{magnitude} Earthquake — {place}",
                description=f"Magnitude {magnitude} earthquake at depth {depth}km near {place}",
                geojson_str=geojson_str,
                source="USGS",
                source_event_id=f"usgs_{event_id}",
                metadata_json=metadata,
                started_at=started_at,
                radius_km=radius_km,
            )

    except Exception as e:
        logger.error(f"Error inserting earthquake data: {e}")
        session.rollback()
    finally:
        session.close()


def main():
    """Run the USGS poller on a 5-minute schedule."""
    logger.info("🌍 Starting USGS Earthquake Poller")

    if not test_connection():
        logger.error("Cannot connect to database. Exiting.")
        return

    # Run once immediately
    poll_usgs()

    # Schedule to run every 5 minutes
    schedule.every(5).minutes.do(poll_usgs)

    logger.info("Polling every 5 minutes. Press Ctrl+C to stop.")
    while True:
        schedule.run_pending()
        time.sleep(1)


if __name__ == "__main__":
    main()
