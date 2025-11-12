# Project Overview

## Project Name: Planner

**Type:** Full-stack web application (Monorepo)
**Status:** Brownfield (in development)
**Created With:** Better-T-Stack

---

## Executive Summary

Planner is a modern TypeScript-based full-stack application built with Next.js, featuring end-to-end type safety through ORPC, PostgreSQL with Drizzle ORM, and Better-Auth for authentication. The project uses a monorepo structure with Turborepo for efficient build orchestration and Bun for fast package management.

---

## Purpose & Vision

This project serves as a task planning and management application built on a modern, type-safe technology stack. It demonstrates best practices for full-stack TypeScript development with a focus on developer experience and code quality.

---

## Tech Stack Summary

### Frontend
- **Framework:** Next.js 16.0 (App Router)
- **UI Library:** React 19.2 with React Compiler
- **Styling:** TailwindCSS 4.1.10
- **Components:** shadcn/ui (Radix UI)
- **State:** TanStack Query 5.85.5
- **Forms:** TanStack Form 1.12.3

### Backend
- **API:** ORPC 1.10.0 (Type-safe RPC)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM 0.44.2
- **Auth:** Better-Auth 1.3.28

### Infrastructure
- **Monorepo:** Turborepo 2.5.4
- **Package Manager:** Bun 1.3.1
- **Linter:** Biome 2.3.4 (via Ultracite)
- **Language:** TypeScript 5.x

---

## Repository Structure

```
planner/
├── apps/
│   └── web/              # Next.js full-stack application
└── packages/
    ├── api/              # ORPC API layer
    ├── db/               # Database schemas (Drizzle)
    └── auth/             # Authentication config (Better-Auth)
```

**Repository Type:** Monorepo
**Total Parts:** 4
**Primary Language:** TypeScript

---

## Architecture Classification

**Architecture Type:** Layered, full-stack with type-safe RPC

**Pattern:**
- Frontend layer (Next.js)
- API layer (ORPC procedures)
- Data layer (Drizzle ORM)
- Auth layer (Better-Auth)

**Communication:** Type-safe RPC over HTTP

**Data Flow:**
```
Browser → Next.js → ORPC Client → /api/rpc → ORPC Server → Drizzle → PostgreSQL
```

---

## Key Features

### Implemented
✅ User authentication (email/password)
✅ Session management
✅ Type-safe API endpoints
✅ Database schema with migrations
✅ Dark/light theme support
✅ Component library (shadcn/ui)
✅ Development tooling (linting, formatting)

### In Development
🚧 Core business features
🚧 Dashboard functionality
🚧 Task management

### Planned
📋 Testing infrastructure
📋 CI/CD pipeline
📋 Production deployment
📋 Monitoring and analytics

---

## Getting Started

### Quick Start

```bash
# Install dependencies
bun install

# Start database
bun run db:start

# Push database schema
bun run db:push

# Start dev server
bun run dev
```

Visit: `http://localhost:3001`

### Prerequisites
- Bun v1.3.1+
- PostgreSQL (or Docker)
- Git

---

## Project Parts Detail

### Part 1: Web (`apps/web`)

**Role:** Frontend and API routes
**Port:** 3001 (development)
**Tech:** Next.js 16, React 19, TailwindCSS

**Key Directories:**
- `src/app/` - Pages and API routes
- `src/components/` - React components
- `src/lib/` - Utilities and clients

**Entry Point:** `src/app/page.tsx`

---

### Part 2: API (`packages/api`)

**Role:** Business logic and RPC procedures
**Tech:** ORPC Server

**Key Files:**
- `src/routers/index.ts` - Procedure definitions
- `src/context.ts` - Request context
- `src/index.ts` - ORPC setup

**Procedures:** 2 (healthCheck, privateData)

---

### Part 3: Database (`packages/db`)

**Role:** Data persistence and schemas
**Tech:** Drizzle ORM, PostgreSQL

**Key Directories:**
- `src/schema/` - Table definitions
- `src/migrations/` - Migration files

**Tables:** 4 (user, session, account, verification)

---

### Part 4: Auth (`packages/auth`)

**Role:** Authentication configuration
**Tech:** Better-Auth

**Key Files:**
- `src/index.ts` - Auth setup

**Features:** Email/password, sessions, OAuth-ready

---

## Integration Points

### Web ↔ API
- **Protocol:** ORPC (type-safe RPC)
- **Endpoint:** `/api/rpc`
- **Type Safety:** Full end-to-end

### API ↔ Database
- **Method:** Direct ORM access
- **Pattern:** Import db from `@planner/db`

### Web ↔ Auth
- **Protocol:** Better-Auth client
- **Endpoint:** `/api/auth/[...all]`

### API ↔ Auth
- **Method:** Session extraction in context
- **Pattern:** Middleware-based validation

---

## Development Workflow

### Daily Development

1. Start database: `bun run db:start`
2. Start dev server: `bun run dev`
3. Make changes (auto-reload enabled)
4. Lint code: `bun run check`
5. Type check: `bun run check-types`

### Database Changes

1. Edit schema files in `packages/db/src/schema/`
2. Push to DB: `bun run db:push` (dev)
3. Or generate migration: `bun run db:generate` (prod)

### Adding Features

1. Define API procedure in `packages/api/src/routers/`
2. Create UI components in `apps/web/src/components/`
3. Build pages in `apps/web/src/app/`
4. Types flow automatically

---

## Code Quality Standards

This project enforces strict code quality through **Ultracite** (Biome preset).

**Standards:**
- TypeScript strict mode
- Explicit types for clarity
- Modern JavaScript/TypeScript patterns
- React 19 best practices
- Accessibility requirements
- Security best practices

See `.claude/CLAUDE.md` for complete standards.

---

## Documentation Map

| Document | Purpose |
|----------|---------|
| `README.md` | Project introduction and quick start |
| `project-overview.md` | High-level project summary (this file) |
| `architecture.md` | Detailed architecture documentation |
| `technology-stack.md` | Complete tech stack breakdown |
| `development-guide.md` | Developer setup and workflows |
| `source-tree-analysis.md` | Annotated directory structure |
| `api-contracts.md` | API endpoint documentation |
| `data-models.md` | Database schema documentation |
| `component-inventory.md` | UI component catalog |
| `.claude/CLAUDE.md` | Code quality standards |

---

## Team & Collaboration

### Development Setup

**Package Manager:** Bun (workspace-enabled)
**Monorepo Tool:** Turborepo
**Linter:** Biome (via Ultracite)
**Version Control:** Git

### Code Standards

- Code formatting enforced by Biome
- Type checking required
- No console.log in production
- Meaningful commit messages

---

## Current Status

### Metrics

- **Components:** 16 (9 UI primitives, 7 application)
- **API Procedures:** 2 (1 public, 1 protected)
- **Database Tables:** 4 (auth schema)
- **Routes:** 3+ pages
- **Lines of Code:** ~2,500+ (estimated)

### Development Phase

**Current:** Foundation complete, feature development in progress
**Next:** Implement core business features
**Future:** Testing, deployment, scaling

---

## Deployment Strategy

### Recommended Platforms

**Frontend & API:**
- Vercel (optimized for Next.js)
- Railway
- Fly.io

**Database:**
- Supabase (managed PostgreSQL)
- Neon (serverless PostgreSQL)
- Railway (managed PostgreSQL)
- AWS RDS

### Environment Variables

Required for production:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NODE_ENV=production`

---

## Success Criteria

### Phase 1: Foundation ✅
- ✅ Project structure established
- ✅ Authentication working
- ✅ Database connected
- ✅ Basic UI implemented

### Phase 2: Features (In Progress)
- 🚧 Core business logic
- 🚧 User dashboard
- 🚧 Task management
- 📋 Settings management

### Phase 3: Quality
- 📋 Test coverage >80%
- 📋 Performance optimization
- 📋 Security hardening
- 📋 Accessibility compliance

### Phase 4: Launch
- 📋 Production deployment
- 📋 Monitoring setup
- 📋 Documentation complete
- 📋 User onboarding

---

## Support & Resources

### Documentation
- **Project Docs:** `/docs` folder
- **API Reference:** `/api/rpc/api-reference` (when running)
- **Database Studio:** `bun run db:studio`

### External Resources
- Next.js: https://nextjs.org/docs
- ORPC: https://orpc.dev
- Drizzle: https://orm.drizzle.team
- Better-Auth: https://better-auth.com
- shadcn/ui: https://ui.shadcn.com

---

## Future Roadmap

### Short Term (1-3 months)
- Complete core features
- Add test suite
- Set up CI/CD
- Deploy to staging

### Medium Term (3-6 months)
- Production launch
- Performance optimization
- Add monitoring
- User feedback integration

### Long Term (6+ months)
- Scale infrastructure
- Add advanced features
- Mobile app (potential)
- API for third-parties

---

## Contact & Contribution

### Getting Help
- Check documentation in `/docs`
- Review code examples
- Follow development guide

### Contributing
- Follow code standards in `.claude/CLAUDE.md`
- Run linter before committing
- Write meaningful commit messages
- Test changes locally

---

**Last Updated:** 2025-11-10
**Documentation Version:** 1.0
**Project Version:** Initial development
