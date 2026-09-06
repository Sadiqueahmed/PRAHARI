package com.prahari.common.util;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

/**
 * Utility class for creating JTS geometry objects.
 * 
 * All geometries use SRID 4326 (WGS 84) — the standard GPS coordinate system.
 * This matches the PostGIS column definitions in the database schema.
 */
public final class GeometryUtil {

    /** SRID 4326 = WGS 84 (standard GPS coordinate reference system) */
    public static final int SRID_WGS84 = 4326;

    /** Shared GeometryFactory configured with WGS 84 SRID */
    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), SRID_WGS84);

    private GeometryUtil() {
        // Utility class — prevent instantiation
    }

    /**
     * Get the shared GeometryFactory instance.
     */
    public static GeometryFactory getFactory() {
        return GEOMETRY_FACTORY;
    }

    /**
     * Create a PostGIS-compatible Point from longitude and latitude.
     * 
     * @param longitude East-West coordinate (e.g., 91.7362 for Guwahati)
     * @param latitude  North-South coordinate (e.g., 26.1445 for Guwahati)
     * @return JTS Point with SRID 4326
     */
    public static Point createPoint(double longitude, double latitude) {
        Point point = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        point.setSRID(SRID_WGS84);
        return point;
    }
}
