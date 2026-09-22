<p align="center">
  <h1 align="center">🛡️ Project Prahari</h1>
  <p align="center">
    <strong>Multi-Hazard Disaster Intelligence Platform for Northeast India</strong>
  </p>
  <p align="center">
    Real-time monitoring of floods, earthquakes, landslides, and air quality<br/>
    with 2.5D terrain mapping, RBAC-based command views, and SOS emergency response.
  </p>
</p>

---

## Overview

**Prahari** (Hindi: प्रहरी, "sentinel / guardian") is a full-stack disaster intelligence platform purpose-built for the geologically and climatically vulnerable Northeast India region. It combines real-time data from external hazard APIs, PostGIS spatial analysis, and an interactive 2.5D terrain map to provide actionable situational awareness for citizens, NGOs, and government agencies.

### Key Capabilities

| Feature | Description |
|---------|-------------|
| **2.5D Terrain Map** | Mapbox GL JS with 3D terrain, atmospheric effects, and toggleable hazard layers |
| **Multi-Hazard Monitoring** | Floods, earthquakes, landslides, and air quality — all in one dashboard |
| **SOS Panic Button** | GPS-enabled emergency alerts with acknowledge/resolve workflow |
| **RBAC Command Views** | Role-specific dashboards (Citizen → NGO → Government → Super Admin) |
| **Relief Camp Management** | Track camp capacity, inventory levels, and supply deficits/surpluses |
| **Automated Data Ingestion** | Python pollers for USGS, AQICN, CWC, and NASA LHASA |
| **Alert Engine** | WhatsApp, Twilio SMS, and Fast2SMS notification channels |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React 19 + Vite)                   │
│  ┌─────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Sidebar  │  │ MapContainer │  │ Floating │  │ Detail Panels  │  │
│  │ (RBAC)  │  │ (Mapbox GL)  │  │ Widgets  │  │ SOS/Inventory  │  │
│  └────┬────┘  └──────┬───────┘  └─────┬────┘  └───────┬────────┘  │
│       └──────────────┴─────────────────┴───────────────┘           │
│                          │ Axios (JWT)                              │
├──────────────────────────┼──────────────────────────────────────────┤
│                   Spring Boot 3.3.5 (Java 21)                       │
│  ┌──────────┐  ┌────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐  │
│  │ Auth API │  │Hazard  │  │River API│  │ SOS API  │  │AQI API │  │
│  │ (JWT)    │  │API     │  │         │  │          │  │        │  │
│  └────┬─────┘  └───┬────┘  └────┬────┘  └────┬─────┘  └───┬────┘  │
│       └────────────┴────────────┴─────────────┴────────────┘       │
│                          │ JPA + Hibernate 6                        │
├──────────────────────────┼──────────────────────────────────────────┤
│                  PostgreSQL 16 + PostGIS 3.4                        │
│  users │ hazard_zones │ river_stations │ sos_requests │ aqi_data   │
│  roles │ geometry     │ river_readings │ responses    │ readings   │
└──────────────────────────────────────────────────────────────────────┘
        ▲                                         ▲
        │ Direct SQL                              │ REST API
┌───────┴─────────────────────────────────────────┴──────────────────┐
│                   Python Data Ingestion Pipeline                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐  │
│  │ AQICN    │  │ USGS     │  │ CWC/NWDP  │  │ NASA LHASA      │  │
│  │ (30 min) │  │ (5 min)  │  │ (15 min)  │  │ (6 hrs, stub)   │  │
│  └──────────┘  └──────────┘  └───────────┘  └──────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React, Vite, Tailwind CSS v4 | 19.x, 6.x, 4.x |
| **Map Engine** | Mapbox GL JS | 3.x |
| **Charts** | Recharts | 2.x |
| **Backend** | Spring Boot, Java | 3.3.5, 21 (Virtual Threads) |
| **ORM** | Hibernate 6, Spring Data JPA | 6.x |
| **Database** | PostgreSQL + PostGIS | 16, 3.4 |
| **Migrations** | Flyway | Auto |
| **Auth** | JWT (HS256) + Spring Security | — |
| **Ingestion** | Python, SQLAlchemy, Shapely | 3.12+ |
| **Notifications** | WhatsApp Cloud API, Twilio, Fast2SMS | — |

---

## Database Schema (10 Tables)

```
users                    hazard_zones              river_stations
├── id (UUID)            ├── id (UUID)             ├── id (UUID)
├── email                ├── hazard_type (ENUM)    ├── station_code
├── full_name            ├── severity (ENUM)       ├── station_name
├── password_hash        ├── title                 ├── river_name
├── phone                ├── geometry (GEOMETRY)   ├── location (POINT)
├── role (ENUM)          ├── radius_km             ├── danger_level
└── organization         ├── source                ├── warning_level
                         ├── metadata (JSONB)      └── basin_name
sos_requests             └── is_active
├── id (UUID)                                      river_readings
├── user_id (FK)         relief_camps              ├── station_id (FK)
├── hazard_zone_id (FK)  ├── id (UUID)             ├── water_level
├── longitude/latitude   ├── name                  ├── flow_rate
├── status (ENUM)        ├── capacity              ├── trend (ENUM)
├── responder_id (FK)    ├── current_occupancy     └── is_above_danger
└── resolved_at          └── location (POINT)
                                                   air_quality_readings
inventory_items          alert_logs                ├── station_name
├── camp_id (FK)         ├── id (UUID)             ├── location (POINT)
├── item_name            ├── user_id (FK)          ├── aqi
├── category (ENUM)      ├── channel (ENUM)        ├── dominant_pollutant
├── quantity             ├── status                ├── pm25, pm10, o3...
├── minimum_required     └── sent_at               └── reading_time
└── unit
```

---

## Getting Started

### Prerequisites

- **Java 21** (for Virtual Threads)
- **Node.js 20+** and npm
- **Python 3.12+** (for data ingestion)
- **PostgreSQL 16** with **PostGIS 3.4** extension
- **Mapbox** account (free tier works)

### 1. Clone and Configure

```bash
git clone https://github.com/Sadiqueahmed/PRAHARI.git
cd PRAHARI

# Copy environment template and fill in your values
cp .env.example .env
```

Edit `.env` with your credentials:
```bash
# Required
POSTGRES_PASSWORD=your_secure_password
VITE_MAPBOX_TOKEN=pk.your_mapbox_token    # Get at https://mapbox.com
JWT_SECRET=$(openssl rand -hex 32)

# Optional (for data ingestion)
AQICN_API_TOKEN=your_aqicn_token          # Get at https://aqicn.org/data-platform/token/
```

### 2. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE USER prahari_admin WITH PASSWORD 'your_password';"
psql -U postgres -c "CREATE DATABASE prahari OWNER prahari_admin;"
psql -U postgres -d prahari -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -U postgres -d prahari -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
```

> Schema is auto-created by Flyway on first backend startup.

### 3. Backend (Spring Boot)

```bash
cd prahari-backend

# Run with Gradle wrapper
./gradlew bootRun

# Or build and run the JAR
./gradlew build
java -jar build/libs/prahari-backend-0.0.1-SNAPSHOT.jar
```

The API starts at `http://localhost:8081/api`.

### 4. Frontend (React + Vite)

```bash
cd prahari-frontend

npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite proxy forwards `/api` → `http://localhost:8081`.

### 5. Data Ingestion (Python)

```bash
cd prahari-ingestion

pip install -r requirements.txt

# Run all pollers concurrently
python run_all.py

# Or run specific pollers
python run_all.py --only usgs      # Earthquakes only
python run_all.py --only aqicn     # Air quality only
python run_all.py --once           # One-shot (no scheduling)
```

---

## API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login, returns JWT |

### Hazards (`/api/hazards`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/hazards` | JWT | All active hazard zones |
| GET | `/hazards/:id` | JWT | Specific hazard zone |
| GET | `/hazards/type/:type` | JWT | Filter by type (FLOOD, EARTHQUAKE, etc.) |
| GET | `/hazards/bbox` | JWT | Zones in map viewport |
| GET | `/hazards/summary` | JWT | Active count by type (donut chart) |
| POST | `/hazards` | GOV+ | Create hazard zone |
| PUT | `/hazards/:id/deactivate` | GOV+ | Deactivate a zone |

### Rivers (`/api/rivers`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/rivers/stations` | JWT | All stations with latest readings |

### SOS (`/api/sos`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/sos` | JWT | Trigger SOS alert |
| GET | `/sos/active` | NGO+ | List active SOS requests |
| GET | `/sos/count` | JWT | Active SOS count |
| GET | `/sos/coordinates` | GOV+ | SOS coordinates for heatmap |
| PUT | `/sos/:id/acknowledge` | NGO+ | Claim an SOS |
| PUT | `/sos/:id/resolve` | NGO+ | Resolve an SOS |

### Air Quality (`/api/airquality`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/airquality/latest` | JWT | Most recent AQI reading |
| GET | `/airquality/stations` | JWT | Latest AQI per station |
| GET | `/airquality/station/:name` | JWT | Latest for specific station |
| GET | `/airquality/station/:name/history` | JWT | Recent readings (time series) |
| GET | `/airquality/alerts?threshold=150` | JWT | Stations above threshold |

### Inventory (`/api/inventory`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/inventory/camps` | NGO+ | All active relief camps |
| GET | `/inventory/camps/:id` | NGO+ | Camp details |
| GET | `/inventory/camps/nearest` | NGO+ | Nearest camps to GPS point |
| GET | `/inventory/camps/:id/items` | NGO+ | Camp inventory |
| PUT | `/inventory/items/:id` | NGO+ | Update item quantity |
| GET | `/inventory/deficits` | NGO+ | Items below minimum |
| GET | `/inventory/surpluses` | NGO+ | Items above threshold |

---

## RBAC Roles

| Role | Map View | SOS | Hazards | Inventory | Admin |
|------|----------|-----|---------|-----------|-------|
| **CITIZEN** | View all layers | Send SOS | View zones | ❌ | ❌ |
| **NGO** | View + filter | Send + Manage | View zones | Full access | ❌ |
| **GOVERNMENT** | Full command view | Send + Manage | Create + Deactivate | Full access | ❌ |
| **SUPER_ADMIN** | Full command view | Send + Manage | Create + Deactivate | Full access | ✅ |

---

## Data Sources

| Source | Hazard Type | Frequency | API |
|--------|-------------|-----------|-----|
| [USGS Earthquake Feed](https://earthquake.usgs.gov/earthquakes/feed/) | Earthquake | 5 min | Public GeoJSON |
| [AQICN / WAQI](https://aqicn.org/json-api/doc/) | Air Quality | 30 min | API Key (free) |
| [CWC / NWDP](https://nwdp.nwic.gov.in) | Flood (River) | 15 min | Registration required |
| [NASA LHASA](https://github.com/nasa/LHASA) | Landslide | 6 hrs | AWS Open Data (stub) |

---

## Project Structure

```
PRAHARI/
├── prahari-backend/                 # Spring Boot 3.3.5 (Java 21)
│   └── src/main/java/com/prahari/
│       ├── auth/                    # JWT authentication (controller, service, entity)
│       ├── user/                    # User management
│       ├── hazard/                  # Hazard zone CRUD + PostGIS queries
│       ├── river/                   # River monitoring stations & readings
│       ├── sos/                     # SOS panic button workflow
│       ├── airquality/              # AQI readings (entity, repository, service, controller)
│       ├── inventory/               # Relief camp + inventory management
│       ├── alert/                   # WhatsApp/SMS notification engine
│       ├── config/                  # Security, CORS, Jackson config
│       └── common/                  # Shared DTOs (ApiResponse)
│
├── prahari-frontend/                # React 19 + Vite + Tailwind CSS v4
│   └── src/
│       ├── App.jsx                  # Main dashboard orchestrator
│       ├── main.jsx                 # Router entry point
│       ├── index.css                # Design system (glassmorphism tokens)
│       ├── auth/                    # Login, Register, AuthContext, ProtectedRoute
│       ├── api/                     # Axios client with JWT interceptors
│       ├── components/
│       │   ├── map/                 # MapContainer (Mapbox GL 2.5D)
│       │   ├── layout/             # Sidebar, FloatingPanel
│       │   ├── widgets/            # HazardDonut, RiverLevelChart, SOSWidget, AQI
│       │   ├── hazard/             # HazardDetailPanel
│       │   ├── sos/                # SOSButton, SOSManagement
│       │   ├── inventory/          # InventoryDashboard
│       │   └── common/             # ErrorBoundary, LoadingSkeleton
│       └── utils/                  # Constants (map config, hazard colors, roles)
│
├── prahari-ingestion/               # Python data ingestion pipeline
│   ├── run_all.py                   # Unified orchestrator
│   ├── aqicn_poller.py             # AQICN air quality
│   ├── usgs_poller.py              # USGS earthquake feed
│   ├── cwc_scraper.py              # CWC/NWDP river levels
│   ├── lhasa_processor.py          # NASA LHASA landslides (stub)
│   ├── db.py                       # SQLAlchemy + PostGIS helper
│   ├── config.py                   # Environment config
│   └── requirements.txt            # Python dependencies
│
├── docker-compose.yml               # PostgreSQL + PostGIS + PgAdmin
├── .env.example                     # Environment template
└── README.md                        # ← You are here
```

---

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@prahari.dev` | `prahari123` | SUPER_ADMIN |

---

## License

This project is developed as a capstone/research project for disaster management in Northeast India.

---

<p align="center">
  Built with ❤️ for the people of Northeast India 🏔️
</p>