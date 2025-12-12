# Development Guide

## Prerequisites

### Required Software

- **Bun** v1.3.1 or later - JavaScript runtime and package manager
  - Install: `curl -fsSL https://bun.sh/install | bash`
- **Node.js** v20+ - Alternative runtime (optional, Bun preferred)
- **PostgreSQL** - Database (or Docker for local development)
- **Git** - Version control

### Recommended Tools

- **VS Code** - IDE with excellent TypeScript support
- **Drizzle Studio** - Database UI (included via `bun run db:studio`)
- **Docker Desktop** - For local PostgreSQL container

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd planner
```

### 2. Install Dependencies

```bash
bun install
```

This installs all dependencies for the monorepo using Bun workspaces.

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
bun run db:start

# Push schema to database
bun run db:push
```

#### Option B: Using Existing PostgreSQL

1. Create a PostgreSQL database
2. Update `apps/web/.env` with your connection string:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/planner"
   ```
3. Push schema to database:
   ```bash
   bun run db:push
   ```

### 4. Environment Variables

Copy the example environment file:

```bash
cp apps/web/.env.example apps/web/.env
```

Edit `apps/web/.env` and configure:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/planner"

# Better-Auth (generate secure secrets)
BETTER_AUTH_SECRET="<random-32-char-string>"
BETTER_AUTH_URL="http://localhost:3001"

# Optional: OAuth providers
# GITHUB_CLIENT_ID="..."
# GITHUB_CLIENT_SECRET="..."
```

### 5. Start Development Server

```bash
bun run dev
```

This starts:
- Next.js dev server on `http://localhost:3001`
- Hot module replacement
- Type checking
- Auto-reloading on file changes

Visit `http://localhost:3001` in your browser.

---

## Project Scripts

### Root Level Scripts

Run from project root:

| Script | Command | Description |
|--------|---------|-------------|
| **Development** | `bun run dev` | Start all apps in dev mode |
| **Build** | `bun run build` | Build all packages and apps |
| **Type Check** | `bun run check-types` | TypeScript type checking |
| **Lint** | `bun run check` | Lint and format code (Biome) |

### Workspace-Specific Scripts

| Script | Command | Description |
|--------|---------|-------------|
| **Web Only** | `bun run dev:web` | Start only web app |
| **Database Push** | `bun run db:push` | Push schema to database (dev) |
| **DB Studio** | `bun run db:studio` | Open Drizzle Studio UI |
| **Generate Migration** | `bun run db:generate` | Generate migration files |
| **Run Migrations** | `bun run db:migrate` | Apply migrations (production) |
| **Start DB** | `bun run db:start` | Start Docker PostgreSQL |
| **Stop DB** | `bun run db:stop` | Stop Docker PostgreSQL |
| **Remove DB** | `bun run db:down` | Stop and remove container |
| **Watch DB** | `bun run db:watch` | Watch Docker logs |

---

## Development Workflow

### Making Changes

#### 1. Frontend Changes (`apps/web`)

- Edit components in `apps/web/src/components/`
- Edit pages in `apps/web/src/app/`
- Changes hot-reload automatically

**Example:** Adding a new page

```bash
# Create new page
mkdir apps/web/src/app/about
touch apps/web/src/app/about/page.tsx

# Edit page
# Visit http://localhost:3001/about
```

#### 2. API Changes (`packages/api`)

- Edit routers in `packages/api/src/routers/`
- Types automatically sync to frontend
- Server restarts on changes

**Example:** Adding a new procedure

```typescript
// packages/api/src/routers/index.ts
export const appRouter = {
  // ... existing procedures

  getUsers: publicProcedure.handler(async () => {
    const users = await db.select().from(user)
    return users
  }),
}
```

#### 3. Database Changes (`packages/db`)

**Process:**
1. Edit schema files in `packages/db/src/schema/`
2. Generate migration (optional for prod)
3. Push to database

**Example:** Adding a new table

```typescript
// packages/db/src/schema/tasks.ts
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const task = pgTable('task', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').notNull(),
  userId: text('user_id').notNull().references(() => user.id),
})
```

Then:
```bash
# Development: Push directly
bun run db:push

# Production: Generate and run migrations
bun run db:generate
bun run db:migrate
```

#### 4. Authentication Changes (`packages/auth`)

- Edit auth configuration in `packages/auth/src/index.ts`
- Add OAuth providers
- Configure auth options

---

## Code Quality

### Linting and Formatting

This project uses **Ultracite** (Biome preset) for code quality.

**Check for issues:**
```bash
bun run check
```

**Auto-fix issues:**
```bash
npx ultracite fix
```

**Diagnose setup:**
```bash
npx ultracite doctor
```

### Code Standards

See `.claude/CLAUDE.md` for detailed coding standards:
- Type safety guidelines
- React best practices
- Performance optimization
- Security considerations

### Pre-commit Checklist

Before committing:
1. ✅ Run `bun run check` (lint and format)
2. ✅ Run `bun run check-types` (type check)
3. ✅ Test your changes manually in the browser
4. ✅ Ensure no console.log or debugger statements
5. ✅ Write meaningful commit messages

---

## Testing

### Unit Tests

```bash
bun run test          # Run all unit tests
bun run test:web      # Run web app tests only
```

Uses **Bun test runner** (Jest-compatible API).

### E2E Tests

```bash
bun run test:e2e      # Run Playwright E2E tests
```

E2E tests run against preview deployments in CI.

---

## Observability

The project uses **OpenTelemetry** for distributed tracing and structured logging.

### Quick Start

Traces and logs appear in console by default. To send to SigNoz:

```bash
# In apps/web/.env.local
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=planner-web
```

### Using the Logger

```typescript
import { createLogger } from "@planner/logger";

const log = createLogger("my-module");

log.info({ userId: "123" }, "User logged in");
log.warn({ attempt: 3 }, "Rate limit approaching");
log.error({ err: error }, "Failed to process request");
```

Logs automatically include `trace_id` and `span_id` for correlation.

### Key Patterns

#### Module Loading Order (Critical)

In `apps/web/src/instrumentation.node.ts`, `@planner/logger` must NOT be statically imported. The pino logger must be created AFTER PinoInstrumentation is registered.

```typescript
// WRONG - breaks trace correlation
import { createLogger } from "@planner/logger";

// CORRECT - lazy loading
function getLog() {
  const { createLogger } = require("@planner/logger");
  return createLogger("otel");
}
```

See warning comment at top of `instrumentation.node.ts`.

#### Workspace Package Pattern

Use `@planner/logger` (workspace package) instead of direct pino imports. This ensures consistent trace correlation across the monorepo.

```json
{
  "dependencies": {
    "@planner/logger": "workspace:*"
  }
}
```

For packages that need `@opentelemetry/api`, add it as a **peerDependency** to avoid duplicate instances (Bun isolated linker issue).

### After OTEL Changes

When modifying observability code:

1. Run `bun run dev:web` and verify console shows traces
2. Check `trace_id` appears in log output
3. If using SigNoz, verify traces appear in dashboard
4. Test error handling: errors should have `x-trace-id` header

### Files Reference

| File | Purpose |
|------|---------|
| `apps/web/src/instrumentation.ts` | Next.js entry point |
| `apps/web/src/instrumentation.node.ts` | OTEL SDK configuration |
| `packages/logger/src/index.ts` | Shared pino logger |
| `packages/logger/src/span.ts` | Span utilities (getTraceId, recordSpanError) |

---

## Database Management

### Drizzle Studio

Visual database browser:

```bash
bun run db:studio
```

Opens at `https://local.drizzle.studio`

**Features:**
- Browse tables
- Edit data
- View relationships
- Run queries

### Migration Workflow

**Development:** Use `db:push` for quick iterations

```bash
# Edit schema
# Then push changes
bun run db:push
```

**Production:** Use migrations for version control

```bash
# 1. Edit schema
# 2. Generate migration
bun run db:generate

# 3. Review migration SQL in packages/db/src/migrations/

# 4. Apply migration
bun run db:migrate
```

### Database Seeding

Create a seed script in `packages/db/src/seed.ts`:

```typescript
import { db } from './index'
import { user } from './schema/auth'

async function seed() {
  await db.insert(user).values({
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
}

seed()
```

Run: `bun run packages/db/src/seed.ts`

---

## Building for Production

### Build All Packages

```bash
bun run build
```

**Build Order (automatic via Turborepo):**
1. `packages/db` (dependencies: none)
2. `packages/auth` (dependencies: db)
3. `packages/api` (dependencies: auth, db)
4. `apps/web` (dependencies: api, auth)

### Build Outputs

- `packages/*/dist/` - TypeScript compiled output (tsdown)
- `apps/web/.next/` - Next.js production build

### Running Production Build

```bash
# Build
bun run build

# Start production server
cd apps/web
bun start
```

---

## Environment Configuration

### Development vs Production

**Development:**
- Uses `.env` files
- Hot reloading enabled
- Source maps included
- Detailed error messages

**Production:**
- Uses environment variables from hosting platform
- Optimized builds
- Error tracking recommended

### Required Environment Variables

**Minimum for production:**
```env
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="<secure-random-string>"
BETTER_AUTH_URL="https://your-domain.com"
NODE_ENV="production"
```

---

## Troubleshooting

### Common Issues

#### Port 3001 already in use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
PORT=3002 bun run dev
```

#### Database connection failed

```bash
# Check if PostgreSQL is running
bun run db:start

# Verify DATABASE_URL in apps/web/.env
# Ensure the database exists
```

#### Type errors after package changes

```bash
# Rebuild packages
bun run build

# Restart dev server
bun run dev
```

#### Bun cache issues

```bash
# Clear Bun cache
rm -rf node_modules
rm bun.lock
bun install
```

#### Turbo cache issues

```bash
# Clear Turborepo cache
rm -rf .turbo
bun run build
```

---

## Monorepo Structure Tips

### Adding a New Package

1. Create folder in `packages/` or `apps/`
2. Add `package.json` with workspace dependencies
3. Add to Turborepo pipeline in `turbo.json`
4. Install dependencies: `bun install`

### Importing Workspace Packages

Use the `workspace:*` protocol:

```json
{
  "dependencies": {
    "@planner/api": "workspace:*"
  }
}
```

### Turborepo Task Dependencies

Edit `turbo.json` to define task order:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]  // Build dependencies first
    }
  }
}
```

---

## IDE Setup

### VS Code

**Recommended Extensions:**
- Biome (for linting/formatting)
- Tailwind CSS IntelliSense
- Prisma/Drizzle (for schema highlighting)

**Workspace Settings:**

`.vscode/settings.json`:
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Other IDEs

Configure your IDE to:
- Use Biome for formatting
- Enable TypeScript language server
- Set Node version to 20+
- Use Bun as package manager

---

## Performance Tips

### Development Performance

- **Use Bun:** 2-3x faster than npm/yarn
- **Turborepo caching:** Speeds up repeated builds
- **Hot reload:** Changes reflect instantly without full rebuild

### Build Performance

- **Parallel builds:** Turborepo builds packages in parallel
- **Incremental builds:** Only rebuild changed packages
- **Remote caching:** Share build cache across team (optional)

---

## Getting Help

### Resources

- **Next.js Docs:** https://nextjs.org/docs
- **ORPC Docs:** https://orpc.dev
- **Drizzle Docs:** https://orm.drizzle.team
- **Better-Auth Docs:** https://better-auth.com
- **Bun Docs:** https://bun.sh/docs

### Debugging

**Enable verbose logging:**
```bash
DEBUG=* bun run dev
```

**Inspect database:**
```bash
bun run db:studio
```

**Check build output:**
```bash
bun run build --verbose
```

---

## Next Steps

1. **Add features:** Start building new pages and API procedures
2. **Set up testing:** Configure Bun test or Vitest for unit and component tests
3. **Add E2E tests:** Set up Playwright for end-to-end testing
4. **Deploy:** Choose a hosting platform (Vercel, Railway, etc.)
5. **Monitor:** Add error tracking (Sentry) and analytics
6. **Scale:** Add more packages and apps as needed
