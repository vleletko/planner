# Migrate App Dockerfile
# Build from monorepo root after running: turbo prune @planner/migrate --docker
# Then: docker build -f apps/migrate/Dockerfile -t migrate ./out

FROM oven/bun:1.3.1-slim AS runner

WORKDIR /app

# Copy pruned package.json files first (for better layer caching)
COPY json/ ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Copy full source
COPY full/ ./

WORKDIR /app/apps/migrate

# Environment variables (set at runtime)
# DATABASE_URL - PostgreSQL connection string (required)
# RESET_DB - Set to "true" to drop all tables (optional)
# SEED_PROFILE - "none" or "test" (optional, default: none)

# Run migrations and seeding
CMD ["bun", "run", "src/index.ts"]
