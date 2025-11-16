# Epic Technical Specification: Foundation & Project Infrastructure

Date: 2025-11-11
Author: BMad
Epic ID: 1
Status: Draft

---

## Overview

Epic 1 establishes the complete technical foundation for the Planner application, a flexible project management system inspired by Jira. This epic delivers six foundational stories covering project infrastructure setup, database configuration with PostgreSQL and Drizzle ORM, Better-Auth integration for secure authentication, a responsive UI shell with dark mode support using shadcn/ui, automated CI/CD deployment pipeline, and comprehensive testing infrastructure with both unit and E2E tests.

This foundation enables all subsequent epic development by providing a production-ready monorepo architecture (Turborepo + Bun), type-safe API communication via ORPC, and a cohesive design system based on the Balanced Teal theme. The epic aligns with the PRD's goal of creating an enterprise-grade project management platform while maintaining developer velocity through modern tooling and strict code quality standards enforced by Ultracite/Biome.

## Objectives and Scope

**In Scope:**
- Monorepo setup with Next.js 16, React 19, TypeScript 5 in strict mode
- PostgreSQL database with Drizzle ORM, migration system, and connection pooling
- Better-Auth session-based authentication with email/password signup and login
- Responsive UI shell with header, navigation, user menu, and theme toggle (light/dark mode)
- shadcn/ui component library integration with Balanced Teal design system
- CI/CD pipeline with linting (Ultracite/Biome), type checking, testing, and automated deployment
- Comprehensive testing infrastructure: Bun test runner for unit/integration tests, Playwright for E2E tests in dedicated `apps/e2e/` application
- Environment configuration for development, staging, and production
- Docker Compose setup for local PostgreSQL development
- Health check endpoints and structured logging with Pino

**Out of Scope:**
- Project creation and workspace management (Epic 2)
- Workflow configuration and custom field definitions (Epics 3-4)
- Kanban board UI and drag-and-drop functionality (Epic 5)
- Resource management and validation systems (Epic 6)
- Search, filtering, and advanced performance optimizations (Epic 7)
- Comments, activity tracking, and user collaboration features (Epic 8)
- Telegram notification integration (Epic 9)
- Configuration import/export and templates (Epic 10)

## System Architecture Alignment

This epic implements the foundational layers of the architecture document:

**Monorepo Structure (Turborepo):**
- `/apps/web/` - Next.js 16 frontend with React 19 and App Router
- `/packages/api/` - ORPC backend API with type-safe procedures
- `/packages/auth/` - Better-Auth configuration and session management
- `/packages/db/` - Drizzle ORM schema, migrations, and database client

**Database Architecture:**
- PostgreSQL 16 as primary data store (Docker Compose for local dev, managed service for production)
- Drizzle ORM 0.44.2 for type-safe queries and schema management
- Connection pooling via Drizzle's built-in pooling
- Migration runner via Drizzle Kit
- Schema location: `/packages/db/src/schema/auth.ts` (extending existing Better-Auth tables)

**Authentication Flow:**
```
Better-Auth (session management)
  ↓ Session validation on every request
ORPC Context (user, session injected)
  ↓ Authorization checks in procedures
Protected API Routes
```

**UI Architecture:**
- TailwindCSS 4 + shadcn/ui (New York style) for component library
- Design tokens system via CSS variables for theming
- Theme provider with light/dark mode support and localStorage persistence
- Existing components integrated: header, user-menu, mode-toggle, theme-provider

**Deployment Architecture:**
- Vercel for Next.js application hosting (recommended)
- Managed PostgreSQL (Neon, Supabase, or Railway recommended)
- Environment-specific configuration via environment variables
- CI/CD via GitHub Actions with automated linting, type checking, testing, and deployment

**Code Quality:**
- Ultracite preset enforcing strict Biome linting/formatting rules
- TypeScript strict mode across all packages
- Accessibility-first patterns (WCAG 2.1 AA compliance)

## Detailed Design

### Services and Modules

| Service/Module | Responsibility | Inputs | Outputs | Owner |
|----------------|----------------|--------|---------|-------|
| **Next.js Web App** (`/apps/web/`) | Frontend application, routing, SSR/SSG | User interactions, API responses | Rendered HTML/React components | Frontend |
| **ORPC API** (`/packages/api/`) | Type-safe API layer, business logic, session validation | Client requests with session cookies | JSON responses with typed data | Backend |
| **Better-Auth** (`/packages/auth/`) | Authentication, session management, CSRF protection | Email/password credentials | Session tokens, user objects | Backend |
| **Drizzle DB** (`/packages/db/`) | Database schema, migrations, type-safe queries | SQL queries via Drizzle query builder | Typed database records | Backend |
| **Theme Provider** | Theme state management, persistence | User theme preference | Theme context (light/dark mode) | Frontend |
| **Logger** (`/packages/api/src/lib/logger.ts`) | Structured logging with Pino | Log events (info, warn, error) | JSON-formatted logs | Backend |
| **Testing Infrastructure** | Unit tests (Bun), E2E tests (Playwright) | Test scenarios | Pass/fail results, coverage reports | QA/Dev |

### Data Models and Contracts

**Users Table (extending Better-Auth schema):**
```typescript
// Located in /packages/db/src/schema/auth.ts
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Indexes
createIndex('users_email_idx').on(users.email);
```

**Sessions Table (Better-Auth):**
```typescript
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Indexes
createIndex('sessions_user_id_idx').on(sessions.userId);
createIndex('sessions_token_idx').on(sessions.token);
```

**ORPC Context Type:**
```typescript
// /packages/api/src/context.ts
export type Context = {
  user?: {
    id: string;
    email: string;
    name?: string;
    image?: string;
  };
  session?: {
    id: string;
    expiresAt: Date;
  };
};
```

### APIs and Interfaces

**Authentication API (Better-Auth + ORPC):**

```typescript
// POST /api/rpc/auth.signUp
Input: {
  email: string;
  password: string;
  name?: string;
}
Output: {
  user: { id, email, name, image };
  session: { id, expiresAt };
}
Errors:
  - 400: Email already exists
  - 400: Password too weak (< 8 chars)
  - 500: Database error

// POST /api/rpc/auth.signIn
Input: {
  email: string;
  password: string;
}
Output: {
  user: { id, email, name, image };
  session: { id, expiresAt };
}
Errors:
  - 401: Invalid credentials
  - 500: Database error

// POST /api/rpc/auth.signOut
Input: {} (session from cookie)
Output: { success: true }
Errors:
  - 401: Not authenticated
  - 500: Database error

// GET /api/rpc/auth.getSession
Input: {} (session from cookie)
Output: {
  user: { id, email, name, image } | null;
  session: { id, expiresAt } | null;
}
```

**Health Check API:**
```typescript
// GET /api/health
Output: {
  status: 'ok' | 'error';
  timestamp: string;
  database: 'connected' | 'disconnected';
}
```

### Workflows and Sequencing

**Story 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6 (Sequential Implementation)**

**Authentication Flow (Story 1.3):**
```
1. User navigates to /login
2. Next.js renders login page with sign-in form
3. User submits credentials
4. Frontend calls ORPC auth.signIn procedure
5. Backend validates credentials with Better-Auth
6. On success: Session created, httpOnly cookie set
7. Frontend redirects to /dashboard
8. Subsequent requests include session cookie
9. ORPC middleware validates session on each request
10. User object injected into ORPC context
```

**Theme Toggle Flow (Story 1.4):**
```
1. User clicks theme toggle button
2. Theme provider updates theme state (light ↔ dark)
3. CSS variables updated via data-theme attribute on <html>
4. Theme preference saved to localStorage
5. On page reload: Theme restored from localStorage
```

**Deployment Flow (Story 1.5):**
```
1. Developer pushes code to main branch
2. GitHub Actions triggered
3. CI pipeline runs:
   a. Install dependencies (bun install)
   b. Lint code (biome check)
   c. Type check (turbo check-types)
   d. Run unit tests (bun test)
   e. Run E2E tests (bun test:e2e)
   f. Build production bundle (turbo build)
4. On success: Deploy to Vercel staging
5. On staging validation: Promote to production
```

## Non-Functional Requirements

### Performance

**Targets (derived from Architecture and UX specs):**
- Page load time: < 2s (cold start), < 500ms (warm)
- Time to Interactive (TTI): < 3s
- API response time: < 200ms (p95), < 500ms (p99)
- Database query time: < 50ms (p95), < 200ms (p99)
- Theme transition: 200ms smooth fade (no jarring flashes)
- Hot module replacement: < 1s update time in development

**Performance Strategies:**
- Next.js App Router for automatic code splitting
- Server components for reduced client bundle size
- Connection pooling for database efficiency
- Indexed database queries on frequently accessed fields
- Static asset optimization via Next.js image optimization
- Caching headers for immutable assets (1 year)

### Security

**Authentication Security:**
- Password hashing: bcrypt with configurable salt rounds
- Session tokens: Cryptographically secure random generation
- Session cookies: httpOnly, secure, sameSite=lax flags
- CSRF protection: Better-Auth built-in token validation
- Session expiration: 7 days default, configurable
- Rate limiting: Consider adding rate limiting middleware (future enhancement)

**Data Security:**
- SQL injection prevention: Drizzle ORM parameterized queries
- XSS prevention: React auto-escaping, Content-Security-Policy headers
- Environment variables: Never commit secrets (.env files in .gitignore)
- Secrets management: Use deployment platform secret storage
- Database credentials: Encrypted at rest by managed provider

**Authorization:**
- Session validation on every ORPC procedure call
- User context injected after successful session validation
- Protected routes redirect to /login if unauthenticated
- Role-based access control prepared for Epic 2 (project_members table)

### Reliability/Availability

**Availability Targets:**
- Uptime: 99.9% (8.76 hours downtime/year acceptable)
- Database uptime: Depends on managed provider SLA
- Health check endpoint: /api/health for monitoring

**Reliability Measures:**
- Database connection pooling with automatic reconnection
- Graceful degradation: Display error states instead of crashing
- Error boundaries in React for component failure isolation
- Structured logging for debugging production issues
- Environment variable validation at startup (fail fast)

**Recovery:**
- Database migrations: Reversible via Drizzle migration system
- Deployment rollback: Vercel supports instant rollback to previous deployment
- Session persistence: Sessions survive application restarts (stored in database)

### Observability

**Logging (Pino structured logs):**
- Log levels: debug, info, warn, error
- Development: Pretty-printed to console
- Production: JSON format for log aggregation services
- Required log signals:
  - Authentication events (signup, signin, signout, failed attempts)
  - API request/response (with latency, status code, user ID)
  - Database queries (with execution time)
  - Error stack traces (with context)

**Monitoring:**
- Health check endpoint: /api/health (status, database connection, timestamp)
- Deployment platform metrics (Vercel Analytics): Request count, response times, error rates
- Future: Consider adding Sentry for error tracking (not in Epic 1 scope)

**Tracing:**
- ORPC context: Request ID generated per request for tracing
- Logs include request ID for correlation across services

## Dependencies and Integrations

**Core Framework Dependencies:**
- **Next.js**: 16.0.0 - React framework with App Router
- **React**: 19.2.0 - UI library
- **React DOM**: 19.2.0 - React rendering
- **TypeScript**: ^5 - Type safety

**Backend Dependencies:**
- **ORPC**: ^1.10.0 (@orpc/server, @orpc/client, @orpc/zod, @orpc/openapi) - Type-safe API framework
- **Better-Auth**: ^1.3.28 - Authentication framework
- **Drizzle ORM**: ^0.44.2 - Database ORM
- **Drizzle Kit**: ^0.31.2 - Migration tooling
- **pg**: ^8.14.1 - PostgreSQL client
- **Pino**: (via logger setup) - Structured logging
- **Zod**: ^4.1.12 - Schema validation

**Frontend Dependencies:**
- **shadcn/ui** components (via radix-ui ^1.4.2, class-variance-authority, clsx, tailwind-merge)
- **TailwindCSS**: ^4.1.10 - Utility-first CSS framework
- **next-themes**: ^0.4.6 - Theme management
- **Lucide React**: ^0.546.0 - Icon library
- **Sonner**: ^2.0.5 - Toast notifications
- **@tanstack/react-query**: ^5.85.5 - Data fetching and caching
- **@tanstack/react-form**: ^1.12.3 - Form state management

**Build & Development Tools:**
- **Bun**: 1.3.1 - JavaScript runtime and package manager
- **Turbo**: ^2.5.4 - Monorepo build system
- **Biome**: 2.3.4 (@biomejs/biome) - Linter and formatter
- **Ultracite**: 6.3.2 - Biome preset with strict rules
- **tsdown**: ^0.15.5 - TypeScript build tool
- **dotenv**: ^17.2.2 - Environment variable loading

**Testing Dependencies (Story 1.6):**
- **Bun test runner**: Built-in with Bun runtime
- **@testing-library/react**: For React component testing
- **Playwright**: ^1.x - E2E testing framework

**External Integrations:**
- **PostgreSQL**: 16+ - Database (Docker Compose locally, managed service in production)
- **Vercel**: Deployment platform (recommended)
- **GitHub Actions**: CI/CD pipeline

**Version Constraints:**
- Node.js: 18+ runtime compatibility required
- PostgreSQL: 16+ recommended
- Bun: 1.3.1 exact version via packageManager field

## Acceptance Criteria (Authoritative)

**AC1: Project Infrastructure (Story 1.1)**
- Development environment starts successfully with `bun install && bun run dev`
- Monorepo includes /apps/web, /packages/api, /packages/db, /packages/auth
- TypeScript strict mode enabled across all packages
- Build completes without errors: `bun run build`
- Hot module replacement works in development

**AC2: Database Setup (Story 1.2)**
- Application connects to PostgreSQL successfully on startup
- Drizzle ORM configured with connection pooling and type-safe queries
- Migrations run successfully: `bun run db:migrate`
- Development data seeds successfully: `bun run db:seed`
- Users table exists with proper schema and indexes

**AC3: Authentication (Story 1.3)**
- User can sign up with email/password and is auto-logged in
- User can log in with valid credentials and is redirected to /dashboard
- Invalid credentials show clear error message
- Session persists across browser refresh
- Session cookies have httpOnly, secure, sameSite flags
- Logout clears session and redirects to /login
- Forms follow UX design: inline validation, error colors (var(--color-error)), success states

**AC4: UI Shell (Story 1.4)**
- Logged-in user sees header with logo, navigation, user menu
- Theme toggle switches between light/dark mode smoothly (200ms transition)
- Theme preference persists in localStorage
- UI follows design spec: max-width 1280px, Balanced Teal colors, shadcn/ui components
- Keyboard navigation works on all interactive elements
- ARIA labels present on header, menu, and buttons (WCAG 2.1 AA)

**AC5: Deployment Pipeline (Story 1.5)**
- Code push to main triggers CI/CD pipeline
- Pipeline runs: linting (Ultracite), type checking, unit tests, build
- Production build is optimized (minified, tree-shaken, images optimized)
- Environment variables configured for dev/staging/production
- .env.example documents all required variables
- Health check endpoint /api/health returns status

**AC6: Testing Infrastructure (Story 1.6)**
- Bun test runner configured: `bun test` runs successfully
- React Testing Library available for component tests
- Example unit test exists and passes
- E2E tests in dedicated `apps/e2e/` app
- Playwright configured for Chromium/Firefox/WebKit
- Example E2E test (login flow) exists and passes
- `bun test:e2e` runs E2E tests successfully
- Test database separate from development database
- CI/CD runs all tests and blocks deployment on failure
- README documents how to run and write tests

## Traceability Mapping

| AC | Spec Section | Components/APIs | Test Idea |
|----|-------------|-----------------|-----------|
| AC1 | Detailed Design > Services and Modules | Monorepo setup, package.json scripts, TypeScript configs | Unit: Verify package imports work; E2E: Run `bun run dev` and check server starts |
| AC2 | Data Models > Users/Sessions Tables | Drizzle schema, migration files, db client | Unit: Test Drizzle query builder; E2E: Verify migrations run, seed data loads |
| AC3 | APIs > Authentication API | Better-Auth, ORPC auth procedures, sign-in/sign-up forms | Unit: Mock auth procedures; E2E: Test full signup → login → logout flow |
| AC4 | Services > Theme Provider | Theme provider, mode-toggle, header, user-menu components | Unit: Test theme state transitions; E2E: Verify theme toggle and persistence |
| AC5 | Workflows > Deployment Flow | GitHub Actions config, build scripts, health endpoint | Unit: Test build output; E2E: Deploy to staging and verify health check |
| AC6 | Services > Testing Infrastructure | Bun test config, Playwright config, test helpers | Unit: Run example tests; E2E: Verify E2E test suite runs in CI |

## Risks, Assumptions, Open Questions

**Risks:**
1. **Risk**: Migration from existing brownfield codebase could introduce regressions
   - **Mitigation**: Comprehensive E2E test suite covering critical paths, code review before merge
2. **Risk**: Better-Auth session management may have edge cases with concurrent requests
   - **Mitigation**: Load testing session validation logic, implement request queuing if needed
3. **Risk**: Docker Compose PostgreSQL setup may differ from production managed database
   - **Mitigation**: Use identical PostgreSQL version (16), document production connection string format
4. **Risk**: Ultracite/Biome strict linting may require significant refactoring of existing code
   - **Mitigation**: Gradual adoption with `biome check --write`, allocate time for fixes

**Assumptions:**
1. Existing code in `/apps/web/src/components/` is functional and follows design system
2. Better-Auth schema in `/packages/db/src/schema/auth.ts` is correct and complete
3. Vercel is the chosen deployment platform (architecture recommends it)
4. PostgreSQL 16 is available as managed service in production (Neon/Supabase/Railway)
5. WCAG 2.1 AA compliance is sufficient (not AAA level required)

**Open Questions:**
1. **Q**: Should we implement rate limiting on auth endpoints in Epic 1 or defer to later epic?
   - **Next Step**: Discuss with PM, likely defer to Epic 2 when project access control is implemented
2. **Q**: What is the preferred production database provider (Neon, Supabase, Railway)?
   - **Next Step**: Evaluate cost, latency, and features; recommend Neon for serverless PostgreSQL
3. **Q**: Should E2E tests run on every push or only on PRs to main?
   - **Next Step**: Configure GitHub Actions to run E2E only on PRs to save CI minutes
4. **Q**: What is the session expiration policy (7 days default, configurable)?
   - **Next Step**: Confirm with PM, document in .env.example as AUTH_SESSION_EXPIRY_DAYS=7

## Test Strategy Summary

**Test Levels:**

**1. Unit Tests (Bun test runner):**
- **Coverage Target**: 70%+ line coverage for critical paths
- **Scope**:
  - Authentication logic (signup validation, password hashing)
  - Database queries (Drizzle query builder correctness)
  - ORPC procedures (input validation, error handling)
  - Theme provider state management
- **Frameworks**: Bun built-in test runner, React Testing Library for components
- **Location**: `*.test.ts` and `*.test.tsx` files colocated with source

**2. Integration Tests (Bun test runner):**
- **Scope**:
  - Database migrations (run migrations, verify schema)
  - Auth flow end-to-end (signup → login → session validation → logout)
  - API routes (call ORPC procedures with test database)
- **Test Database**: Separate PostgreSQL instance for tests (DATABASE_URL_TEST)

**3. E2E Tests (Playwright in `apps/e2e/`):**
- **Coverage**: Critical user journeys
- **Test Cases**:
  - User signup flow: Navigate to /login, click "Sign Up", fill form, submit, verify redirect to /dashboard
  - User login flow: Navigate to /login, enter credentials, submit, verify /dashboard
  - Theme toggle: Login, click theme toggle, verify dark mode applied, refresh page, verify theme persisted
  - Session persistence: Login, refresh page, verify still logged in
  - Logout: Login, click user menu, click logout, verify redirect to /login
- **Browsers**: Chromium (primary), Firefox, WebKit (smoke tests)
- **Screenshots/Videos**: Capture on failure for debugging

**4. Visual Regression Tests (Future Enhancement - Not in Epic 1):**
- Consider adding Percy or Chromatic for visual diff testing in later epics

**Test Execution:**
- **Local Development**: `bun test` (unit), `bun test:e2e` (E2E)
- **CI/CD**: Run on every PR, block merge if tests fail
- **Test Data**: Seed scripts provide consistent test fixtures
- **Cleanup**: Database reset between test runs to ensure isolation

**Edge Cases to Cover:**
- Concurrent login attempts from same user
- Session expiration edge case (login at T-1s before expiry)
- Weak password detection (< 8 chars, no special chars)
- Duplicate email signup attempt
- Invalid email format
- Theme toggle during page load
- Database connection loss (graceful error handling)

**Test Documentation:**
- README.md in `apps/e2e/` with setup instructions
- Example tests demonstrate best practices (AAA pattern: Arrange, Act, Assert)
- Test helper functions documented with JSDoc comments
