# ====================================================================
# Prahari Backend — Multi-stage Docker Build
# Stage 1: Build with Gradle + JDK 21
# Stage 2: Run with lightweight JRE 21
# ====================================================================

# --- Build Stage ---
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy Gradle wrapper and build files first (for Docker layer caching)
COPY gradle/ gradle/
COPY gradlew build.gradle settings.gradle ./
RUN chmod +x gradlew

# Download dependencies (cached unless build files change)
RUN ./gradlew dependencies --no-daemon 2>/dev/null || true

# Copy source and build
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# --- Runtime Stage ---
FROM eclipse-temurin:21-jre
WORKDIR /app

# Create non-root user for security
RUN groupadd -r prahari && useradd -r -g prahari prahari

# Copy the built JAR
COPY --from=build /app/build/libs/*.jar app.jar

# Switch to non-root user
USER prahari

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/api/actuator/health || exit 1

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
