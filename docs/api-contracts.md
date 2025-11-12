# API Contracts

## Overview

Type-safe RPC via **ORPC** - procedures defined in `packages/api/src/routers/index.ts`.

**Endpoints:**
- `/api/rpc` - RPC procedures
- `/api/rpc/api-reference` - OpenAPI docs (auto-generated)
- `/api/auth/[...all]` - Better-Auth endpoints

---

## Current Procedures

**File:** `packages/api/src/routers/index.ts`

**Public (no auth):**
- `healthCheck` - Returns "OK"

**Protected (requires auth):**
- `privateData` - Returns user data

See router file for complete procedure definitions.

---

## How It Works

### Context
- Created in `packages/api/src/context.ts`
- Extracts session from request headers via Better-Auth
- Available to all procedures

### Middleware
- `requireAuth` - Validates session exists, throws `UNAUTHORIZED` if not
- Applied to protected procedures

### Request Flow
```
Client → /api/rpc → Context → Middleware → Procedure → Response
```

### Type Safety
ORPC infers types end-to-end:
```typescript
// Define once in router
export const appRouter = {
  myProcedure: publicProcedure.handler(() => ({ data: "value" })),
}

// TypeScript knows the return type automatically
const result = await client.myProcedure()
// result: { data: string }
```

---

## Error Handling

**Standard Error Codes:**
- `UNAUTHORIZED` - Not authenticated
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `BAD_REQUEST` - Invalid input

Errors are logged via `onError` interceptor.

---

## OpenAPI Docs

**URL:** `/api/rpc/api-reference` (when running dev server)

Auto-generated from procedure definitions with Zod schemas.

---

## Adding Procedures

**Public procedure:**
```typescript
// packages/api/src/routers/index.ts
export const appRouter = {
  myProcedure: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input }) => {
      return { data: "value" }
    }),
}
```

**Protected procedure:**
```typescript
export const appRouter = {
  myProtectedProcedure: protectedProcedure
    .input(z.object({ name: z.string() }))
    .handler(async ({ context, input }) => {
      const userId = context.session.user.id
      // Implementation
      return result
    }),
}
```

Types flow automatically to the client.

---

## Client Usage

**Setup:** `apps/web/src/utils/orpc.ts`

**In components:**
```typescript
import { client } from '@/utils/orpc'

// Direct call
const result = await client.myProcedure({ id: "123" })

// With TanStack Query
const { data } = useQuery({
  queryKey: ['myProcedure', id],
  queryFn: () => client.myProcedure({ id }),
})
```
