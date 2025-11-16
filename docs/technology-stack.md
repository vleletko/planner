# Technology Stack

## Overview

Monorepo using **Turborepo** + **Bun** with full-stack TypeScript and end-to-end type safety.

**Core Infrastructure:**
- **Build:** Turborepo 2.5.4
- **Runtime:** Bun 1.3.1
- **Language:** TypeScript 5.x
- **Linter:** Biome (via Ultracite)
- **Validation:** Zod

---

## Stack by Part

### Web (`apps/web`)
- **Framework:** Next.js 16 (App Router) + React 19
- **Styling:** TailwindCSS 4.1.10 + shadcn/ui
- **State:** TanStack Query + TanStack Form
- **API:** ORPC Client (type-safe RPC)

### API (`packages/api`)
- **Framework:** ORPC Server 1.10.0
- **Features:** OpenAPI generation, Zod validation
- **Build:** tsdown

### Database (`packages/db`)
- **ORM:** Drizzle 0.44.2
- **Database:** PostgreSQL (via pg driver)
- **Tools:** Drizzle Kit, Docker Compose
- **Build:** tsdown

### Auth (`packages/auth`)
- **Library:** Better-Auth 1.3.28
- **Build:** tsdown

---

## Key Architecture Decisions

### Why Monorepo?
- Share types across frontend/backend
- Single source of truth for dependencies
- Atomic commits across all packages

### Why ORPC?
- End-to-end type safety (no manual API client code)
- Automatic OpenAPI docs
- Better DX than REST for internal APIs

### Why Drizzle?
- TypeScript-first, SQL-like syntax
- Lightweight and fast
- Excellent migration tools

### Why Better-Auth?
- Modern, type-safe
- Works with any database
- Flexible configuration

---

## Type Safety Flow

```
Database Schema (Drizzle)
  ↓ inferred types
API Procedures (ORPC)
  ↓ router types
Frontend (ORPC Client)
  ↓ autocomplete
Components
```

**Result:** Change a database column → TypeScript errors in frontend immediately.

---

## Configuration

**Key Files:**
- `turbo.json` - Monorepo task pipeline
- `biome.json` - Linting/formatting (extends Ultracite)
- `tsconfig.base.json` - Shared TypeScript config
- `drizzle.config.ts` - Database migrations
- `next.config.ts` - React Compiler enabled

**Workspaces:** Bun workspaces with `workspace:*` protocol for inter-package dependencies.
