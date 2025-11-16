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
- **Story File**: `.bmad-ephemeral/stories/1-3-authentication-system-integration.md`

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
