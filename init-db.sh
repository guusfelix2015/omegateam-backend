#!/bin/bash
set -e

# This script runs when the PostgreSQL container starts for the first time
echo "Initializing database for Lineage CP..."

# The database and user are already created by the environment variables
# This script can be used for additional initialization if needed

echo "Database initialization completed!"
