#!/bin/bash
set -e

# Create separate databases for each microservice
# This script runs automatically when the PostgreSQL container starts for the first time

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE auth_db;
    CREATE DATABASE task_db;
    CREATE DATABASE file_db;

    -- Grant permissions
    GRANT ALL PRIVILEGES ON DATABASE auth_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE task_db TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON DATABASE file_db TO $POSTGRES_USER;
EOSQL

echo "✅ Separate databases created: auth_db, task_db, file_db"
