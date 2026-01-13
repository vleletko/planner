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

**Projects Router** (`packages/api/src/routers/projects.ts`):
- `projects.list` - List user's projects with member counts
- `projects.get` - Get single project by ID (with membership check)
- `projects.create` - Create new project (validates key/name uniqueness)
- `projects.update` - Update project (owner/admin only, key immutable)
- `projects.checkKeyAvailable` - Check if project key is available

See router files for complete procedure definitions.

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

The project uses `@orpc/tanstack-query` for seamless TanStack Query integration with automatic query key management.

**In components:**
```typescript
import { orpc } from '@/utils/orpc'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Queries - auto-generated queryKey
const { data } = useQuery(orpc.projects.list.queryOptions())

// Queries with input
const { data } = useQuery(
  orpc.projects.get.queryOptions({ input: { projectId } })
)

// Mutations
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: (input) => orpc.projects.create.call(input),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["projects"] })
  },
})
```

**When to use raw TanStack Query:**
For advanced scenarios (debounced search, custom caching), use raw queries:
```typescript
const { data } = useQuery({
  queryKey: ['custom-search', debouncedQuery],
  queryFn: () => onSearch?.(debouncedQuery),
  staleTime: 30_000,
  enabled: debouncedQuery.length > 0,
})
```
