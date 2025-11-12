# Data Models

## Overview

Database schemas defined in TypeScript using **Drizzle ORM** with **PostgreSQL**.

**Schema Files:** `packages/db/src/schema/`
**Migrations:** `packages/db/src/migrations/`
**ORM:** Drizzle ORM v0.44.2

---

## Current Schema

**File:** `packages/db/src/schema/auth.ts`

**Tables:**
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth providers & credentials
- `verification` - Email verification tokens

**Relationships:**
- User → Sessions (cascade delete)
- User → Accounts (cascade delete)
- Verification is independent

See the schema file for complete column definitions.

---


## Configuration

**Drizzle Config:** `packages/db/drizzle.config.ts`
**Connection:** `packages/db/src/index.ts` exports `db` client
**Environment:** Reads `DATABASE_URL` from `apps/web/.env`

---

## Working with Schema

### Making Changes

1. Edit schema files in `packages/db/src/schema/`
2. Development: `bun run db:push` (immediate)
3. Production: `bun run db:generate` → review SQL → `bun run db:migrate`

### Type Inference

```typescript
import { user } from '@planner/db/schema/auth'
import type { InferSelectModel } from 'drizzle-orm'

type User = InferSelectModel<typeof user>
```

Types are automatically inferred from schema definitions.

### Usage

```typescript
import { db } from '@planner/db'
import { user } from '@planner/db/schema/auth'

const users = await db.select().from(user)
```

---

## Key Points

- Schema is designed for Better-Auth compatibility
- Passwords are hashed (never plaintext)
- Session tokens are unique and indexed
- User deletion cascades to sessions and accounts
- Local dev uses Docker Compose for PostgreSQL
