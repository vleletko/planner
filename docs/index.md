# Planner - Project Documentation Index

**Welcome to the comprehensive documentation for the Planner project.**

This is a brownfield monorepo project with complete technical documentation to support AI-assisted development and team collaboration.

---

## Project Overview

- **Type:** Monorepo (Turborepo) with 4 parts
- **Primary Language:** TypeScript
- **Architecture:** Layered full-stack with type-safe RPC
- **Status:** Development (brownfield)

### Quick Reference by Part

#### Web Application (`apps/web`)
- **Type:** Full-stack Next.js application
- **Tech Stack:** Next.js 16, React 19, TailwindCSS, shadcn/ui
- **Entry Point:** `src/app/page.tsx`
- **Port:** 3001

#### API Layer (`packages/api`)
- **Type:** RPC backend
- **Tech Stack:** ORPC Server, TypeScript
- **Root:** `packages/api/src/`
- **Procedures:** 2 (healthCheck, privateData)

#### Database (`packages/db`)
- **Type:** Data layer
- **Tech Stack:** Drizzle ORM, PostgreSQL
- **Root:** `packages/db/src/`
- **Tables:** 4 (user, session, account, verification)

#### Authentication (`packages/auth`)
- **Type:** Auth configuration
- **Tech Stack:** Better-Auth
- **Root:** `packages/auth/src/`

---

## Generated Documentation

### Core Documentation

- **[Project Overview](./project-overview.md)** - Executive summary and project details
- **[Architecture](./architecture.md)** - Comprehensive architecture documentation
  - System architecture diagrams
  - Part-specific architecture details
  - Integration points and data flow
  - Design decisions and patterns
- **[Technology Stack](./technology-stack.md)** - Complete tech stack breakdown
  - Global tools and infrastructure
  - Per-part technology details
  - Architecture patterns
  - Configuration files

### Development Documentation

- **[Development Guide](./development-guide.md)** - Setup and workflows
  - Prerequisites and installation
  - Development scripts
  - Code quality standards
  - Database management
  - Building for production
  - Troubleshooting guide
- **[Source Tree Analysis](./source-tree-analysis.md)** - Annotated directory structure
  - Complete file tree
  - Critical directories explained
  - Integration points
  - Entry points by part

### API & Data Documentation

- **[API Contracts](./api-contracts.md)** - API endpoint documentation
  - ORPC procedures (public and protected)
  - Authentication endpoints
  - Request/response formats
  - Error handling
  - Client usage examples
- **[Data Models](./data-models.md)** - Database schema documentation
  - Table schemas with relationships
  - Migration strategy
  - Type safety patterns
  - Better-Auth integration

### Component Documentation

- **[Component Inventory](./component-inventory.md)** - UI component catalog
  - shadcn/ui primitives (9 components)
  - Application components (7 components)
  - Usage examples
  - Component patterns
  - Accessibility notes

---

## Existing Documentation

- **[README.md](../README.md)** - Project introduction and quick start
- **[.claude/CLAUDE.md](../.claude/CLAUDE.md)** - Code quality standards (Ultracite)
  - Type safety guidelines
  - Modern JavaScript/TypeScript patterns
  - React 19 best practices
  - Performance and security considerations

---

## Getting Started

### For New Developers

1. Read the [README.md](../README.md) for quick introduction
2. Follow the [Development Guide](./development-guide.md) for setup
3. Review [Architecture](./architecture.md) to understand system design
4. Check [Technology Stack](./technology-stack.md) for tech details
5. Explore [Source Tree Analysis](./source-tree-analysis.md) for codebase layout

### For AI-Assisted Development

**Best starting points:**
- [Architecture](./architecture.md) - Understand overall system design
- [API Contracts](./api-contracts.md) - Know available endpoints
- [Data Models](./data-models.md) - Understand database schema
- [Component Inventory](./component-inventory.md) - Available UI components

### Quick Command Reference

```bash
# Development
bun run dev                 # Start development server
bun run check               # Lint and format code
bun run check-types         # TypeScript type checking

# Database
bun run db:start            # Start PostgreSQL container
bun run db:push             # Push schema changes (dev)
bun run db:studio           # Open database UI
bun run db:generate         # Generate migrations

# Build
bun run build               # Build all packages
```

---

## Documentation Organization

### By Concern

**Architecture & Design:**
- [Architecture](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Project Overview](./project-overview.md)

**Development & Operations:**
- [Development Guide](./development-guide.md)
- [Technology Stack](./technology-stack.md)

**API & Integration:**
- [API Contracts](./api-contracts.md)
- [Data Models](./data-models.md)

**Frontend:**
- [Component Inventory](./component-inventory.md)
- [Architecture](./architecture.md#part-1-web-application-appsweb)

**Code Quality:**
- [.claude/CLAUDE.md](../.claude/CLAUDE.md)

---

## Integration Architecture

### Multi-Part Communication

```
┌─────────┐
│   Web   │  (Frontend + Next.js API Routes)
└────┬────┘
     │ ORPC (type-safe RPC)
     ▼
┌─────────┐
│   API   │  (Business logic + Procedures)
└────┬────┘
     │
  ┌──┴──┐
  │     │
  ▼     ▼
┌────┐ ┌────┐
│Auth│ │ DB │  (Shared services)
└────┘ └────┘
     │
     ▼
┌──────────┐
│PostgreSQL│
└──────────┘
```

**Details:** See [Architecture - Integration Points](./architecture.md#cross-cutting-concerns)

---

## Key Technologies

| Category | Technology | Version | Documentation |
|----------|-----------|---------|---------------|
| **Framework** | Next.js | 16.0.0 | [Technology Stack](./technology-stack.md#part-1-web-application-appsweb) |
| **UI Library** | React | 19.2.0 | [Component Inventory](./component-inventory.md) |
| **API** | ORPC | 1.10.0 | [API Contracts](./api-contracts.md) |
| **ORM** | Drizzle | 0.44.2 | [Data Models](./data-models.md) |
| **Database** | PostgreSQL | - | [Data Models](./data-models.md) |
| **Auth** | Better-Auth | 1.3.28 | [Architecture](./architecture.md#part-4-authentication-layer-packagesauth) |
| **Monorepo** | Turborepo | 2.5.4 | [Development Guide](./development-guide.md) |
| **Package Manager** | Bun | 1.3.1 | [Development Guide](./development-guide.md) |
| **Linter** | Biome (Ultracite) | 2.3.4 / 6.3.2 | [.claude/CLAUDE.md](../.claude/CLAUDE.md) |

---

## Common Tasks

### Adding a New Feature

1. **Define API endpoint** - Edit `packages/api/src/routers/index.ts`
   - See [API Contracts](./api-contracts.md#adding-new-procedures)
2. **Update database schema** (if needed) - Edit `packages/db/src/schema/`
   - See [Data Models](./data-models.md#migration-strategy)
3. **Create UI components** - Add to `apps/web/src/components/`
   - See [Component Inventory](./component-inventory.md#component-patterns)
4. **Build pages** - Add to `apps/web/src/app/`
   - See [Architecture](./architecture.md#routing-structure)

### Debugging

- **Database Issues:** `bun run db:studio` to inspect data
- **API Issues:** Check `/api/rpc/api-reference` for OpenAPI docs
- **Build Issues:** `bun run build --verbose` for detailed output
- **Type Issues:** `bun run check-types` for TypeScript errors

### Finding Code

- **API Procedures:** `packages/api/src/routers/`
- **Database Schemas:** `packages/db/src/schema/`
- **UI Components:** `apps/web/src/components/`
- **Pages:** `apps/web/src/app/`
- **Auth Config:** `packages/auth/src/`

---

## Maintenance

### Updating Documentation

This documentation was generated by the BMM document-project workflow. To update:

1. Make code changes
2. Run `/bmad:bmm:workflows:document-project` to regenerate docs
3. Review changes in `docs/` folder
4. Commit updated documentation

### Adding New Packages

When adding packages to the monorepo:

1. Update [Source Tree Analysis](./source-tree-analysis.md)
2. Add tech details to [Technology Stack](./technology-stack.md)
3. Update [Architecture](./architecture.md) with integration details
4. Add to this index under "Quick Reference by Part"

---

## Project Metrics

**Generated:** 2025-11-10
**Documentation Files:** 10
**API Endpoints:** 2
**Database Tables:** 4
**UI Components:** 16
**Parts:** 4 (web, api, db, auth)

---

## Support Resources

### Internal
- Project documentation (this folder)
- Code comments inline
- Development guide for common tasks

### External
- **Next.js:** https://nextjs.org/docs
- **ORPC:** https://orpc.dev
- **Drizzle:** https://orm.drizzle.team
- **Better-Auth:** https://better-auth.com
- **shadcn/ui:** https://ui.shadcn.com
- **Bun:** https://bun.sh/docs

---

## BMM Workflow Integration

This documentation supports the BMM (BMAD Method) workflow for brownfield projects:

**Current Phase:** Foundation documented
**Next Phase:** PRD development for new features
**Workflow Status:** See `bmm-workflow-status.yaml`

When creating a brownfield PRD, reference:
- [Architecture](./architecture.md) - System design
- [API Contracts](./api-contracts.md) - Existing endpoints
- [Data Models](./data-models.md) - Database schema
- [Component Inventory](./component-inventory.md) - Available UI

---

**For AI Agents:** This index provides comprehensive context for understanding the Planner codebase. Start with architecture.md for system overview, then drill into specific areas as needed.

**For Developers:** Follow the "Getting Started" section above, then use this index as a reference map for finding specific information.
