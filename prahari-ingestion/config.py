"""
Project Prahari — Data Ingestion Configuration
Loads environment variables for database and API connections.
"""

import os
from dotenv import load_dotenv

# Load .env from the project root
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))


class Config:
    """Central configuration loaded from environment variables."""

    # Database
    POSTGRES_HOST = os.getenv('POSTGRES_HOST', 'localhost')
    POSTGRES_PORT = int(os.getenv('POSTGRES_PORT', '5432'))
    POSTGRES_DB = os.getenv('POSTGRES_DB', 'prahari')
    POSTGRES_USER = os.getenv('POSTGRES_USER', 'prahari_admin')
    POSTGRES_PASSWORD = os.getenv('POSTGRES_PASSWORD', 'prahari_dev_pass_2024')

    @property
    def database_url(self):
        """SQLAlchemy connection string with PostGIS support."""
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Backend API (for posting hazard zones)
    BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8080/api')
    # Service account JWT token for ingestion services
    INGESTION_JWT_TOKEN = os.getenv('INGESTION_JWT_TOKEN', '')

    # AQICN API
    AQICN_API_TOKEN = os.getenv('AQICN_API_TOKEN', '')

    # NWDP / CWC
    NWDP_API_KEY = os.getenv('NWDP_API_KEY', '')


config = Config()
