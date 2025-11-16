#!/bin/bash

# Reset database infrastructure
# This script will:
# 1. Stop and remove Docker containers and volumes
# 2. Start fresh PostgreSQL container
# 3. Run migrations to create schema
# 4. Seed database with test data

set -e  # Exit on any error

echo "🧹 Resetting database infrastructure..."
echo ""

# Step 1: Stop and remove containers and volumes
echo "🔄 Stopping containers and removing volumes..."
docker compose down -v

# Step 2: Start fresh containers
echo ""
echo "🔄 Starting fresh containers..."
docker compose up -d

# Step 3: Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec planner-postgres pg_isready -U postgres -q 2>/dev/null; then
    echo "✅ PostgreSQL is ready"
    break
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 30 ]; then
    echo ""
    echo "❌ PostgreSQL failed to start in time"
    exit 1
  fi
done

# Step 4: Run migrations
echo ""
echo "🔄 Running database migrations..."
bun run db:migrate

# Step 5: Seed database
echo ""
echo "🔄 Seeding database with test data..."
bun run db:seed

echo ""
echo "✅ Database reset completed successfully!"
echo ""
