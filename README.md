# planner

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Self, ORPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Prerequisites

This project requires:
- **Bun 1.3.1** (exact version managed via `packageManager` field)
- **PostgreSQL 16** (for database)

## Getting Started

First, install the dependencies:

```bash
bun install
```
## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Copy the environment file and configure your settings:
```bash
cp apps/web/.env.example apps/web/.env
```

2. Update `apps/web/.env` with your PostgreSQL connection details and auth configuration.

3. Start the PostgreSQL database (using Docker):
```bash
bun run db:start
```

4. Apply the schema to your database:
```bash
bun run db:push
```


Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see your fullstack application.







## Project Structure

```
planner/
├── apps/
│   └── web/         # Fullstack application (Next.js)
├── packages/
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

### Development
- `bun run dev`: Start all applications in development mode
- `bun run dev:web`: Start only the web application
- `bun run dev:native`: Start only the native application

### Building
- `bun run build`: Build all applications for production

### Code Quality
- `bun run check`: Run Biome linter and formatter (with auto-fix)
- `bun run check-types`: Check TypeScript types across all packages

### Component Development
- `bun run storybook`: Start Storybook on port 6006 (from apps/web)
- `bun run test:storybook`: Run component tests via Vitest

## CI/CD Pipeline

This project uses GitHub Actions for automated quality checks and builds.

### Automated Checks

Every pull request and push to `main` automatically runs:

1. **Lint** - Biome code quality checks (`bun run check`)
2. **Type Check** - TypeScript validation (`bun run check-types`)
3. **Build** - Production build verification (`bun run build`)

### Running Checks Locally

Before pushing code, run the same checks locally:

```bash
bun run check         # Lint and format
bun run check-types   # Type check
bun run build         # Build
```

### Pipeline Features

- **Fast Execution**: Bun and Turborepo caching for sub-2-minute runs
- **Fail Fast**: Stops at first error (lint → typecheck → build sequence)
- **Concurrency Control**: Automatically cancels outdated runs when new commits are pushed
- **Caching**: Both Bun dependencies and Turborepo outputs are cached

### Workflow Configuration

See `.github/workflows/ci.yml` for full configuration details.

## Docker Deployment

This project uses Docker for containerized deployments with Next.js standalone output for optimized production images.

<!-- Cache test: 2025-11-17 -->

### Building Docker Images

**Prerequisites:**
- Docker installed locally
- Application built with `bun run build` (creates `.next/standalone/` directory)

**Local Build:**
```bash
# Build the application first
bun run build

# Build Docker image
docker build -t planner:local apps/web

# Run container
docker run -p 3000:3000 --env-file apps/web/.env planner:local
```

**Image Details:**
- Base image: `oven/bun:1.3.1-slim` (~40MB)
- Expected size: <200MB (with standalone output)
- Non-root user: `nextjs` (UID 1001)
- Port: 3000

### CI/CD Docker Builds

Docker images are automatically built and pushed to GitHub Container Registry (GHCR) on every commit:

**Tagging Strategy:**
- **Preview Deployments (PRs)**: `ghcr.io/<owner>/<repo>:pr-<number>`
- **Rollback/Audit**: `ghcr.io/<owner>/<repo>:sha-<git-sha>`

**Process:**
1. CI runs lint, typecheck, and build (with Turborepo cache)
2. Docker job reuses build artifacts (fast - instant Turbo cache hit)
3. Docker packages pre-built `.next/standalone/` into runtime image
4. Image pushed to GHCR with appropriate tags

**Performance:**
- First build: ~3-5 min (cold caches)
- Subsequent builds: ~1-2 min (warm caches)
- Docker packaging: ~10-20 sec (reuses CI build)

### Environment Variables

See `apps/web/.env.example` for all required environment variables.

**Required for Production:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Session signing secret (generate with: `openssl rand -base64 32`)
- `BETTER_AUTH_URL` - Application base URL (e.g., `https://your-domain.com`)
- `CORS_ORIGIN` - CORS origin (should match BETTER_AUTH_URL)

### Troubleshooting

**Image too large (>200MB):**
- Verify standalone output is enabled in `next.config.ts`
- Check `.dockerignore` excludes `node_modules`, `.next`, etc.
- Ensure using `oven/bun:1.3.1-slim` base image

**Build fails in Docker:**
- Ensure `bun run build` succeeds locally first
- Verify `.next/standalone/` directory exists
- Check file permissions (should be owned by nextjs:nodejs)

**Container fails to start:**
- Verify environment variables are set correctly
- Check `docker logs <container-id>` for errors
- Ensure DATABASE_URL is accessible from container

### Database
- `bun run db:push`: Push schema changes to database
- `bun run db:studio`: Open Drizzle Studio (database UI)
- `bun run db:generate`: Generate database migrations
- `bun run db:migrate`: Run database migrations
- `bun run db:seed`: Seed database with test users
- `bun run db:reset`: Complete database reset (drop → recreate → migrate → seed)
- `bun run db:start`: Start PostgreSQL database (Docker)
- `bun run db:watch`: Start PostgreSQL with logs
- `bun run db:stop`: Stop PostgreSQL database
- `bun run db:down`: Stop and remove PostgreSQL container

## Preview Deployments

This project uses **Dokploy** for automated preview deployments on every pull request.

### Overview

Every PR automatically:
1. ✅ Creates isolated preview environment with unique URL
2. ✅ Deploys latest Docker image from GHCR (no rebuild)
3. ✅ Runs smoke tests to verify deployment health
4. ✅ Posts preview URL in PR comments
5. ✅ Updates preview on every commit
6. ✅ Cleans up when PR is closed/merged

**Architecture:** Reuses existing `docker-build` job output - **NO REBUILD** required. Preview deployment pulls pre-built image from GHCR with tag `pr-<number>`.

### Prerequisites

**1. Dokploy Instance:**
- Dokploy server running and accessible
- Project created in Dokploy UI
- API token generated (Settings → Profile → API/CLI)

**2. DNS Configuration:**
- Wildcard A record: `*.preview.example.com` → Dokploy server IP
- DNS propagation verified: `dig pr-1.preview.example.com`

**3. Dokploy Project Secrets:**

Configure in Dokploy UI → Project → Variables:
```env
DB_PASSWORD=<secure-random-password>
BETTER_AUTH_SECRET=<auth-secret>
```

**4. GitHub Repository Secrets:**

Configure in GitHub Settings → Secrets and variables → Actions:
```env
DOKPLOY_URL=https://dokploy.example.com
DOKPLOY_API_TOKEN=<your-api-token>
DOKPLOY_PROJECT_ID=<project-uuid>
APP_BASE_DOMAIN=preview.example.com
```

### How It Works

**Automated Flow (GitHub Actions):**

1. **PR Created/Updated:**
   - CI runs: verify → docker-build → **preview-deploy**
   - Image pushed to GHCR with tag `pr-<number>`

2. **Preview Deploy Job:**
   - Checks if preview exists (list-previews.sh)
   - Creates new preview (create-preview.sh) OR updates existing (update-preview.sh)
   - Waits for deployment to be ready (polls Dokploy API)

3. **Smoke Tests:**
   - Curls `/health` endpoint for 5 minutes (30 retries × 10s)
   - Fails deployment if health check doesn't pass

4. **PR Comment:**
   - Posts preview URL: `https://pr-42.preview.example.com`
   - Updates existing comment on subsequent commits (no spam)

5. **PR Closed:**
   - Cleanup workflow triggers (preview-cleanup.yml)
   - Deletes preview deployment and comments PR
   - **Note:** Database volumes must be cleaned manually in Dokploy UI

### Manual Testing

**Scripts Location:** `.dokploy/scripts/`

**Test Preview Creation:**
```bash
cd .dokploy/scripts

# Set required environment variables
export DOKPLOY_URL="https://dokploy.example.com"
export DOKPLOY_API_TOKEN="your-api-token"
export PROJECT_ID="project-uuid"
export GHCR_IMAGE="ghcr.io/vleletko/planner"
export APP_BASE_DOMAIN="preview.example.com"

# Create preview for PR #999
./create-preview.sh 999

# List all active previews
./list-previews.sh

# Update preview (e.g., after new commit)
./update-preview.sh 999

# Delete preview
./delete-preview.sh 999
```

**Expected Output:**
- Create: ~60-120s (includes SSL cert generation)
- Update: ~20-40s (cert cached)
- Delete: ~5-10s

### Preview Environment Details

**Resources per Preview:**
- Docker Compose stack with 2 services: `web` + `db`
- CPU: 0.5-1.0 cores
- Memory: 400-500MB
- Disk: ~100MB + database data

**Services:**
- **web**: Next.js app (pre-built from GHCR)
- **db**: PostgreSQL 15 Alpine (isolated per preview)

**Features:**
- ✅ Automatic HTTPS via Traefik + Let's Encrypt
- ✅ Isolated PostgreSQL database per preview
- ✅ Health checks for deployment verification
- ✅ Zero-downtime updates
- ✅ Persistent data (survives container restarts)

**Environment Variables (per preview):**
```env
GHCR_IMAGE=ghcr.io/vleletko/planner
IMAGE_TAG=pr-42
APP_NAME=planner-pr-42
PREVIEW_DOMAIN=pr-42.preview.example.com
DB_PASSWORD=${DB_PASSWORD}  # From Dokploy project secrets
BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}  # From Dokploy project secrets
NODE_ENV=preview
```

### Troubleshooting

**Preview deployment fails:**
- Check GitHub Actions logs for error details
- Verify all GitHub secrets are set correctly
- Verify Dokploy project secrets exist (DB_PASSWORD, BETTER_AUTH_SECRET)
- Test scripts manually (see Manual Testing above)

**Preview URL not accessible:**
- Verify DNS wildcard record is configured
- Check DNS propagation: `dig pr-<number>.preview.example.com`
- Check Dokploy logs for Traefik errors
- Wait for SSL cert generation (first deployment may take longer)

**Smoke tests timeout:**
- Verify health check endpoint exists: `apps/web/app/api/health/route.ts`
- Check Dokploy deployment logs for startup errors
- Verify database connection (DATABASE_URL)
- Check if preview is actually running in Dokploy UI

**Preview not cleaned up:**
- Check preview-cleanup.yml workflow logs
- Manually delete using: `./delete-preview.sh <pr-number>`
- Clean database volumes in Dokploy UI: Settings → Clean unused volumes

**Database volume cleanup:**
- Dokploy doesn't auto-delete volumes when preview is deleted
- Manually clean in Dokploy UI: Settings → Clean unused volumes
- Look for volumes named: `planner-pr-<number>-db`

### Performance

**Deployment Times:**
- Create preview: 60-120s (includes SSL cert)
- Update preview: 20-40s (cert cached)
- Delete preview: 5-10s

**CI Workflow Times (per PR commit):**
- verify job: ~2-3 min (existing)
- docker-build job: ~30s (existing, with cache)
- preview-deploy job: ~1-2 min (new)
- **Total:** ~4-6 min per commit

### Research & Implementation

For detailed implementation decisions and architecture, see:
- **Research Document**: `_bmad-output/implementation-artifacts/1-5-research/phase-3-preview-deployments.md`
- **Docker Compose Config**: `.dokploy/docker-compose.preview.yml`
- **Lifecycle Scripts**: `.dokploy/scripts/*.sh`

## Authentication

This project uses **Better-Auth 1.3.28** for session-based authentication with email/password credentials.

### Quick Start

1. **Environment Variables** (already configured in `apps/web/.env`):
   ```env
   BETTER_AUTH_SECRET=8cJgPXHZ41VuZOo7AhrlTZE0ZeZWeNSj
   BETTER_AUTH_URL=http://localhost:3001
   CORS_ORIGIN=http://localhost:3001
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/planner
   ```

2. **Seed Test Users**:
   ```bash
   bun run db:seed
   ```

3. **Available Test Accounts**:
   - ✅ `test@example.com` / `TestPassword123!` (verified)
   - ✅ `admin@example.com` / `AdminPassword123!` (verified)
   - ✅ `demo@example.com` / `DemoPassword123!` (verified)
   - ❌ `unverified@example.com` / `UnverifiedPassword123!` (unverified)

### Key Features

- **Session Management**: httpOnly cookies with 7-day expiration
- **Security**: XSS protection (httpOnly), CSRF protection (sameSite=lax), password hashing (scrypt)
- **Protected Routes**: Automatic redirect to `/login` for unauthenticated users
- **Form Validation**: Inline validation with clear error messages
- **API Endpoints**: Auto-generated at `/api/auth/*` (sign-up, sign-in, sign-out, session)

### Testing Authentication

For comprehensive manual testing procedures, see:
- **Testing Guide**: `docs/authentication-testing-guide.md`
- **Story File**: `_bmad-output/implementation-artifacts/1-3-authentication-system-integration.md`

Quick test flow:
1. Navigate to http://localhost:3001/login
2. Sign up with new email or sign in with test account
3. Verify redirect to `/dashboard`
4. Test protected routes, logout, and session persistence

### Architecture

- **Auth Configuration**: `packages/auth/src/index.ts`
- **Auth Client**: `apps/web/src/lib/auth-client.ts`
- **ORPC Context**: `packages/api/src/context.ts`
- **Login Page**: `apps/web/src/app/login/page.tsx`
- **Protected Routes**: Use `auth.api.getSession()` in server components

For more details, see `docs/architecture.md#Authentication-Flow`.
