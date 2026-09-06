"""
Project Prahari — Database Connection Helper
Provides PostgreSQL/PostGIS connection for all data ingestion services.
"""

import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import config

logger = logging.getLogger(__name__)

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    config.database_url,
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,  # Recycle connections every hour
    echo=False,
)

# Session factory
SessionLocal = sessionmaker(bind=engine)


def get_session():
    """Get a new database session. Use as a context manager."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_connection():
    """Test the database connection and PostGIS extension."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT PostGIS_Version()"))
            version = result.scalar()
            logger.info(f"✅ Connected to PostGIS version: {version}")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False


def insert_hazard_zone(session, hazard_type, severity, title, description,
                        geojson_str, source, source_event_id, metadata_json,
                        started_at, radius_km=None):
    """
    Insert a new hazard zone into PostGIS.

    Uses ST_GeomFromGeoJSON to convert GeoJSON to a PostGIS geometry.
    Sets SRID to 4326 (WGS 84).

    Args:
        session: SQLAlchemy session
        hazard_type: FLOOD, EARTHQUAKE, LANDSLIDE, AIR_QUALITY
        severity: LOW, MEDIUM, HIGH, CRITICAL
        title: Human-readable title
        description: Detailed description
        geojson_str: GeoJSON geometry string
        source: Data source (USGS, CWC, etc.)
        source_event_id: External event ID for deduplication
        metadata_json: JSON string with source-specific metadata
        started_at: ISO 8601 timestamp
        radius_km: Optional radius for display purposes

    Returns:
        UUID of the inserted hazard zone, or None if duplicate
    """
    # Check for duplicate source event
    existing = session.execute(
        text("SELECT id FROM hazard_zones WHERE source_event_id = :event_id"),
        {"event_id": source_event_id}
    ).fetchone()

    if existing:
        logger.info(f"Skipping duplicate: {source_event_id}")
        return None

    result = session.execute(
        text("""
            INSERT INTO hazard_zones
                (hazard_type, severity, title, description, geometry,
                 radius_km, source, source_event_id, metadata, started_at)
            VALUES
                (:hazard_type, :severity, :title, :description,
                 ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326),
                 :radius_km, :source, :source_event_id,
                 :metadata::jsonb, :started_at::timestamptz)
            RETURNING id
        """),
        {
            "hazard_type": hazard_type,
            "severity": severity,
            "title": title,
            "description": description,
            "geojson": geojson_str,
            "radius_km": radius_km,
            "source": source,
            "source_event_id": source_event_id,
            "metadata": metadata_json,
            "started_at": started_at,
        }
    )

    session.commit()
    zone_id = result.scalar()
    logger.info(f"Inserted hazard zone: {title} [{hazard_type}] id={zone_id}")
    return zone_id
