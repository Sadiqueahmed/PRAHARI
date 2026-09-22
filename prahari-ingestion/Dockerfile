# Prahari Data Ingestion — Python 3.12
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for psycopg2 and shapely
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc libgeos-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run the unified orchestrator
CMD ["python", "run_all.py"]
