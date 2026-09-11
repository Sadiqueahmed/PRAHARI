package com.prahari.config;

import org.n52.jackson.datatype.jts.JtsModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Jackson configuration for JTS geometry serialization.
 * 
 * Registers the JtsModule so that PostGIS geometry objects (Point, Polygon, etc.)
 * are automatically serialized to/from GeoJSON in REST responses.
 * 
 * Example output:
 * <pre>
 * {
 *   "location": {
 *     "type": "Point",
 *     "coordinates": [91.7362, 26.1445]
 *   }
 * }
 * </pre>
 */
@Configuration
public class JacksonConfig {

    @Bean
    public JtsModule jtsModule() {
        return new JtsModule();
    }
}
