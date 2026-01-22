# Architecture

## Executive Summary

This architecture defines the technical foundation for Planner's workflow management system. The system extends an existing Next.js 16 + React 19 + ORPC monorepo with dynamic card validation, configurable workflows, and resource validation capabilities. Key architectural innovations include a field type registry system with dual (backend/frontend) implementations, a custom card validation orchestrator that handles complex multi-layered validation, and a resource validation framework with pluggable validators for external systems (SSH, API, databases).

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| **Framework** | Next.js | 16.0.0 | All | Already established (brownfield) |
| **UI Library** | React | 19.0.0 | All | Already established (brownfield) |
| **API Pattern** | ORPC | 1.10.0 | All | Already established (brownfield) |
| **Database** | PostgreSQL | Latest | All | Already established (brownfield) |
| **ORM** | Drizzle | 0.44.2 | All | Already established (brownfield) |
| **Authentication** | Better-Auth | 1.3.28 | Epic 2 | Already established (brownfield) |
| **Validation Architecture** | Custom Card Validator + Zod | 3.x | Epic 3, 4, 5 | Two domains: standard forms use Zod, card validation uses custom orchestrator with field type registry |
| **Field Type System** | Dual Registry Pattern | N/A | Epic 3, 4 | Backend validators + Frontend components, shared FieldType enum enforces completeness |
| **State Management** | React Query (TanStack Query) | 5.x | Epic 5, 7 | Server state with optimistic updates, works with ORPC |
| **Form Management** | React Hook Form | 7.x | Epic 3, 4, 5 | Dynamic field rendering with validation integration |
| **File Storage** | S3-compatible (R2/S3) | N/A | Epic 4 | S3 SDK in code, s3rver for local dev, R2/S3 for production |
| **Background Jobs** | pg-boss | Latest | Epic 4, 6, 9 | PostgreSQL-based queue, no additional infrastructure |
| **Telegram Integration** | grammy | Latest | Epic 9 | Modern TypeScript-first bot framework |
| **Logging** | Pino | Latest | All | Structured JSON logging, fast performance |
| **Monorepo** | Turborepo | 2.5.4 | All | Already established (brownfield) |
| **Package Manager** | Bun | 1.3.1 | All | Already established (brownfield) |

## Project Structure

```
planner/
├── apps/
│   └── web/                              # Next.js application
│       ├── public/                       # Static assets
│       ├── src/
│       │   ├── app/                      # App Router pages
│       │   │   ├── api/
│       │   │   │   └── rpc/[[...rest]]/route.ts  # ORPC handler
│       │   │   ├── dashboard/            # Dashboard (existing)
│       │   │   ├── login/                # Auth pages (existing)
│       │   │   ├── admin/                     # System admin pages (Epic 3)
│       │   │   │   ├── statuses/              # Global status management
│       │   │   │   ├── card-types/            # Global card type config
│       │   │   │   └── fields/                # Global field config
│       │   │   └── projects/
│       │   │       └── [projectId]/
│       │   │           ├── page.tsx      # Project overview
│       │   │           ├── board/
│       │   │           │   └── page.tsx  # Kanban board (Epic 5, 7)
│       │   │           └── settings/
│       │   │               ├── resources/     # Resource management (Epic 6)
│       │   │               └── notifications/ # Notification config (Epic 9)
│       │   ├── components/
│       │   │   ├── ui/                   # shadcn/ui primitives (existing)
│       │   │   ├── board/                # Kanban board components (Epic 5)
│       │   │   │   ├── kanban-board.tsx
│       │   │   │   ├── card-column.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── card-detail-modal.tsx
│       │   │   │   └── transition-dialog.tsx
│       │   │   ├── fields/               # Field type UI components (Epic 3, 4)
│       │   │   │   ├── registry.ts       # Frontend field component registry
│       │   │   │   ├── text-field.tsx
│       │   │   │   ├── number-field.tsx
│       │   │   │   ├── date-field.tsx
│       │   │   │   ├── dropdown-field.tsx
│       │   │   │   ├── multi-select-field.tsx
│       │   │   │   ├── user-assignment-field.tsx
│       │   │   │   ├── file-attachment-field.tsx
│       │   │   │   ├── rich-text-field.tsx
│       │   │   │   ├── website-reference-field.tsx
│       │   │   │   ├── api-reference-field.tsx
│       │   │   │   ├── database-reference-field.tsx
│       │   │   │   └── fallback-field.tsx
│       │   │   ├── resources/            # Resource management UI (Epic 6)
│       │   │   │   ├── resource-list.tsx
│       │   │   │   ├── resource-form.tsx
│       │   │   │   └── resource-validation-status.tsx
│       │   │   ├── config/               # Configuration UI (Epic 3, 10)
│       │   │   │   ├── status-editor.tsx
│       │   │   │   ├── card-type-editor.tsx
│       │   │   │   ├── field-editor.tsx
│       │   │   │   └── visual-schema-editor.tsx
│       │   │   ├── comments/             # Comments UI (Epic 8)
│       │   │   │   ├── comment-list.tsx
│       │   │   │   └── comment-form.tsx
│       │   │   ├── header.tsx            # App header (existing)
│       │   │   ├── loader.tsx            # Loading indicator (existing)
│       │   │   └── user-menu.tsx         # User menu (existing)
│       │   └── lib/
│       │       ├── auth-client.ts        # Better-Auth client (existing)
│       │       ├── field-components.ts   # Field component loader
│       │       └── utils.ts              # Utilities (existing)
│       ├── components.json               # shadcn/ui config
│       └── next.config.ts                # Next.js config
│
└── packages/
    ├── api/                              # ORPC backend
    │   └── src/
    │       ├── routers/
    │       │   ├── index.ts              # Root router composition
    │       │   ├── projects.ts           # Project CRUD (Epic 2)
    │       │   ├── statuses.ts           # Status management (Epic 3)
    │       │   ├── card-types.ts         # Card type management (Epic 3)
    │       │   ├── fields.ts             # Field configuration (Epic 3, 4)
    │       │   ├── cards.ts              # Card operations (Epic 5)
    │       │   ├── resources.ts          # Resource management (Epic 6)
    │       │   ├── comments.ts           # Comments & activity (Epic 8)
    │       │   └── notifications.ts      # Notification config (Epic 9)
    │       ├── fields/                   # Field type system (Epic 3, 4)
    │       │   ├── types.ts              # Shared FieldType enum
    │       │   ├── registry.ts           # Backend field validator registry
    │       │   ├── text.ts               # Text field type
    │       │   ├── number.ts             # Number field type
    │       │   ├── date.ts               # Date field type
    │       │   ├── dropdown.ts           # Dropdown field type
    │       │   ├── multi-select.ts       # Multi-select field type
    │       │   ├── user-assignment.ts    # User assignment field type
    │       │   ├── file-attachment.ts    # File attachment field type
    │       │   ├── rich-text.ts          # Rich text field type
    │       │   ├── website-reference.ts  # Website resource reference
    │       │   ├── api-reference.ts      # API resource reference
    │       │   ├── database-reference.ts # Database resource reference
    │       │   └── validator.ts          # Card validator orchestrator
    │       ├── resources/                # Resource validation system (Epic 6)
    │       │   ├── types.ts              # Resource type definitions
    │       │   ├── registry.ts           # Resource validator registry
    │       │   ├── website.ts            # Website resource type (SSH validation)
    │       │   ├── api-endpoint.ts       # API endpoint resource type (HTTP validation)
    │       │   ├── database.ts           # Database resource type (connection validation)
    │       │   └── validator.ts          # Resource validator
    │       ├── jobs/                     # Background job processing
    │       │   ├── queue.ts              # pg-boss setup and queue management
    │       │   ├── async-validation.ts   # Async field validation jobs
    │       │   ├── resource-validation.ts # Resource validation jobs
    │       │   └── telegram-notifications.ts # Notification delivery jobs
    │       ├── telegram/                 # Telegram bot (Epic 9)
    │       │   ├── bot.ts                # grammy bot setup
    │       │   ├── commands.ts           # Bot commands (/link)
    │       │   └── send-notification.ts  # Notification sender
    │       ├── storage/                  # File storage (Epic 4)
    │       │   └── s3.ts                 # S3 client setup
    │       ├── lib/
    │       │   └── logger.ts             # Pino structured logger
    │       ├── context.ts                # ORPC context (auth, db)
    │       └── index.ts                  # Package entry point
    │
    ├── db/                               # Database layer
    │   └── src/
    │       ├── schema/
    │       │   ├── auth.ts               # Better-Auth tables (existing)
    │       │   ├── projects.ts           # Projects & members (Epic 2)
    │       │   ├── statuses.ts           # Status definitions (Epic 3)
    │       │   ├── card-types.ts         # Card type definitions (Epic 3)
    │       │   ├── fields.ts             # Field definitions (Epic 3, 4)
    │       │   ├── cards.ts              # Cards & field values (Epic 5)
    │       │   ├── resources.ts          # Resource instances (Epic 6)
    │       │   ├── comments.ts           # Comments & activity (Epic 8)
    │       │   └── notifications.ts      # Notification config (Epic 9)
    │       ├── migrations/               # Drizzle migration files (generated)
    │       ├── index.ts                  # Database export
    │       └── migrate.ts                # Migration runner
    │
    └── auth/                             # Better-Auth configuration (existing)
        └── src/
            └── index.ts                  # Auth config

├── docker-compose.yml                    # PostgreSQL + s3rver
├── package.json                          # Root workspace
├── turbo.json                            # Turborepo config
├── tsconfig.json                         # Root TypeScript config
└── .env.local                            # Environment variables (gitignored)
```

## Epic to Architecture Mapping

| Epic | Components | Database Tables | API Routers | Key Patterns |
|------|-----------|-----------------|-------------|--------------|
| **Epic 1: Foundation** | Monorepo setup | N/A | N/A | Already complete (brownfield) |
| **Epic 2: Project Management** | Project UI, settings | `projects`, `project_members` | `projects` | RBAC with owner/admin/member roles |
| **Epic 3: Global Schema Configuration** | Status/CardType/Field editors (admin area), Card type field config | `statuses`, `card_types`, `fields`, `card_type_field_configs` | `statuses`, `cardTypes`, `fields` | Field type registry, JSONB config storage, System Admin only |
| **Epic 4: Field Types & Validation** | Field components (11 types), Validation UI | `fields.config`, `fields.default_value` | `fields` router validation | Dual field type implementation, async validation jobs |
| **Epic 5: Card Lifecycle** | Kanban board, Card detail, Transition dialog | `cards`, `card_field_values` | `cards` | Card validator orchestrator, optimistic updates, drag-drop |
| **Epic 6: Resource Management** | Resource list/form, Validation status | `resources`, `resource_field_values` | `resources` | Resource validator registry, credential encryption, validation jobs |
| **Epic 7: Search & Filters** | Search bar, Filter UI, Performance optimization | N/A (queries existing tables) | Enhanced `cards` queries | React Query caching, PostgreSQL indexes |
| **Epic 8: Comments & Activity** | Comment list/form, Activity timeline | `comments`, `activity_log` | `comments` | Markdown support, @mentions, immutable activity log |
| **Epic 9: Telegram Notifications** | Telegram linking UI, Notification config | `user_telegram`, `notification_config` | `notifications` | grammy bot, pg-boss job queue, retry logic |
| **Epic 10: Configuration Portability** | Import/export UI, Project duplication | N/A (operates on existing tables) | `projects` router extensions | JSON serialization, schema validation |

## Technology Stack Details

### Core Technologies

**Frontend Stack:**
- **Framework**: Next.js 16.0.0 (App Router)
- **UI Library**: React 19.0.0
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**:
  - React Query (TanStack Query) 5.x for server state
  - React useState/useReducer for UI state
- **Form Management**: React Hook Form 7.x
- **Drag & Drop**: @dnd-kit (for Kanban board)
- **Markdown**: react-markdown or similar
- **Date Handling**: date-fns

**Backend Stack:**
- **API Layer**: ORPC 1.10.0 (type-safe RPC)
- **Database**: PostgreSQL (latest stable)
- **ORM**: Drizzle 0.44.2
- **Authentication**: Better-Auth 1.3.28
- **Background Jobs**: pg-boss (PostgreSQL-based queue)
- **File Storage**: AWS SDK for S3 (works with S3/R2/s3rver)
- **Logging**: Pino (structured JSON logging)
- **Telegram**: grammy (bot framework)

**Development Tools:**
- **Monorepo**: Turborepo 2.5.4
- **Package Manager**: Bun 1.3.1
- **Linting/Formatting**: Biome via Ultracite preset
- **TypeScript**: 5.x (strict mode)
- **Local S3**: s3rver (npm package)
- **Database Container**: PostgreSQL via Docker Compose

### Integration Points

**Type-Safe RPC Flow:**
```
Frontend (React Query)
  ↓ ORPC typed client
API Router (ORPC procedures)
  ↓ Drizzle queries
Database (PostgreSQL)
```

**Authentication Flow:**
```
Better-Auth (session management)
  ↓ Session validation
ORPC Context (user, session)
  ↓ Authorization checks
API Routers (protected procedures)
```

**Field Type System:**
```
Shared FieldType Enum
  ↓ Backend Registry
Field Validators (packages/api/src/fields/)

  ↓ Frontend Registry
Field Components (apps/web/src/components/fields/)
```

**Validation Flow:**
```
User Action (card move, save)
  ↓ React Hook Form
Frontend Validation (pre-check)
  ↓ ORPC call
Backend Card Validator
  ↓ Field Type Registry
Individual Field Validators (sync)
  ↓ pg-boss jobs
Async Validators (external APIs)
  ↓ Resource Validators
Resource validation (SSH/API/DB)
```

**Background Job Flow:**
```
API Router (queues job)
  ↓ pg-boss
Job Queue (PostgreSQL-based)
  ↓ Worker processes
Job Handlers (validation, notifications)
  ↓ Update database
Result stored, UI refreshed
```

## Novel Pattern Designs

### Pattern 1: Field Type Registry System

**Problem:** Dynamic card types with configurable fields require a flexible system where field types are defined in code but instances are configured at runtime. Each field type needs both backend validation logic and frontend rendering components.

**Solution:** Dual registry pattern with shared type contract.

**Components:**

1. **Shared Type Contract** (`packages/api/src/fields/types.ts`):
```typescript
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DROPDOWN = 'dropdown',
  MULTI_SELECT = 'multi_select',
  USER_ASSIGNMENT = 'user_assignment',
  FILE_ATTACHMENT = 'file_attachment',
  RICH_TEXT = 'rich_text',
  WEBSITE_REFERENCE = 'website_reference',
  API_REFERENCE = 'api_reference',
  DATABASE_REFERENCE = 'database_reference',
}

export type FieldTypeBackendHandler = {
  validate: (value: unknown, config: unknown) => Promise<ValidationResult>
  configSchema: z.ZodSchema  // Zod schema for field config validation
}

export type FieldTypeComponentHandler = {
  View: React.ComponentType<FieldViewProps>
  Edit: React.ComponentType<FieldEditProps>
}

// Type-level completeness enforcement
export type FieldTypeBackendRegistry = {
  [K in FieldType]: FieldTypeBackendHandler
}

export type FieldTypeFrontendRegistry = {
  [K in FieldType]: FieldTypeComponentHandler
}
```

2. **Backend Registry** (`packages/api/src/fields/registry.ts`):
```typescript
import { FieldType, type FieldTypeBackendRegistry } from './types'
import { textFieldType } from './text'
import { websiteReferenceFieldType } from './website-reference'
// ... imports for all field types

// TypeScript enforces all field types must be implemented
export const backendFieldRegistry: FieldTypeBackendRegistry = {
  [FieldType.TEXT]: textFieldType,
  [FieldType.WEBSITE_REFERENCE]: websiteReferenceFieldType,
  // ... all field types
}
```

3. **Frontend Registry** (`apps/web/src/components/fields/registry.ts`):
```typescript
import { FieldType, type FieldTypeFrontendRegistry } from '@/api/fields/types'
import { TextFieldView, TextFieldEdit } from './text-field'
// ... imports for all field types

// TypeScript enforces all field types must be implemented
export const frontendFieldRegistry: FieldTypeFrontendRegistry = {
  [FieldType.TEXT]: { View: TextFieldView, Edit: TextFieldEdit },
  // ... all field types
}

// Fallback loader with graceful degradation
export function getFieldComponent(
  fieldType: FieldType,
  mode: 'view' | 'edit'
): React.ComponentType {
  const handler = frontendFieldRegistry[fieldType]

  if (!handler) {
    console.warn(`Missing field handler for type: ${fieldType}`)
    return mode === 'view' ? FallbackFieldView : FallbackFieldEdit
  }

  return mode === 'view' ? handler.View : handler.Edit
}
```

**Guarantees:**
- Build-time: TypeScript won't compile if either registry is incomplete
- Runtime: Fallback components prevent crashes if type is missing
- Type-safety: Shared enum ensures single source of truth

**Database Storage:**
```sql
fields {
  id,
  card_type_id,           -- Field belongs to specific card type
  name,                   -- Field name (e.g., "Description")
  field_type: enum,       -- References FieldType enum
  config: jsonb,          -- Type-specific config (validated by configSchema)
  default_value: jsonb,   -- Default value for this field
  order: int
}
```

### Pattern 2: Card Validation Orchestrator

**Problem:** Cards have complex validation requirements: sync validation (required fields, formats), async validation (external API calls), resource validation (credential testing), conditional validation (field required based on other fields), and cross-field validation. Validation rules depend on card type and target status.

**Solution:** Single validation orchestrator that loads dynamic schemas and coordinates all validation types.

**Architecture:**

```typescript
// packages/api/src/fields/validator.ts

export class CardValidator {
  /**
   * Get validation schema for a card type at a specific status
   * Determines which fields are required/optional for this card type + status
   */
  async getSchema(cardTypeId: string, statusId: string): Promise<ValidationSchema> {
    // Load field configurations for this card type + status (includes field definitions)
    const fieldConfigs = await db.query.cardTypeFieldConfigs.findMany({
      where: and(
        eq(cardTypeFieldConfigs.cardTypeId, cardTypeId),
        eq(cardTypeFieldConfigs.statusId, statusId)
      ),
      with: {
        field: true  // Join with fields table to get field definitions
      },
      orderBy: cardTypeFieldConfigs.displayOrder
    })

    // Build schema from field configurations
    return buildSchema(fieldConfigs)
  }

  /**
   * Validate a card against a schema
   * Runs all validation types and aggregates results
   */
  async validate(card: Card, schema: ValidationSchema): Promise<ValidationResult> {
    const errors: ValidationError[] = []

    // Validate each field value
    for (const field of schema.fields) {
      const fieldValue = card.fieldValues[field.id]

      // Get field type handler from registry
      const handler = backendFieldRegistry[field.fieldType]

      // Run field-specific validation (may be sync or async)
      const result = await handler.validate(fieldValue, field.config)

      if (!result.valid) {
        errors.push({
          field: field.name,
          message: result.message,
          code: result.code
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Singleton instance
export const cardValidator = new CardValidator()
```

**Usage in Status Transition:**
```typescript
// In cards router
async moveCard(input: { cardId: string, targetStatusId: string }) {
  const card = await loadCard(input.cardId)

  // Get schema for target status
  const schema = await cardValidator.getSchema(
    card.cardTypeId,
    input.targetStatusId
  )

  // Validate card
  const result = await cardValidator.validate(card, schema)

  if (!result.valid) {
    throw new ORPCError('BAD_REQUEST', 'Validation failed', {
      errors: result.errors
    })
  }

  // Update card status
  await db.update(cards)
    .set({ statusId: input.targetStatusId })
    .where(eq(cards.id, input.cardId))

  return card
}
```

**Key Points:**
- Single `validate()` method handles all validation types
- Field types internally handle sync vs async (validator doesn't care)
- Resource reference fields delegate to resource validators
- Schema loading determines which fields matter for given status
- Validation is always authoritative on backend

### Pattern 3: Resource Validation Framework

**Problem:** Cards can reference external resources (websites with SSH access, API endpoints, databases) that need validation. Each resource type has different validation logic (SSH connection test, HTTP request, database connection). Resource validation can be slow (10s timeout) and must not block UI.

**Solution:** Resource type registry with pluggable validators, similar to field type pattern.

**Architecture:**

```typescript
// packages/api/src/resources/types.ts

export enum ResourceType {
  WEBSITE = 'website',
  API_ENDPOINT = 'api_endpoint',
  DATABASE = 'database',
}

export type ResourceValidationResult = {
  valid: boolean
  message: string
  timestamp: Date
}

export type ResourceTypeHandler = {
  validate: (resource: ResourceInstance) => Promise<ResourceValidationResult>
  schema: z.ZodSchema  // Schema for resource-specific fields
}

// packages/api/src/resources/website.ts
export const websiteResourceType: ResourceTypeHandler = {
  schema: z.object({
    url: z.string().url(),
    ssh_host: z.string(),
    ssh_port: z.number(),
    ssh_user: z.string(),
    ssh_key: z.string(),
  }),

  validate: async (resource) => {
    const log = createLogger('WebsiteResourceValidator')

    try {
      // Test SSH connection
      const client = new SSHClient()
      await client.connect({
        host: resource.fields.ssh_host,
        port: resource.fields.ssh_port,
        username: resource.fields.ssh_user,
        privateKey: resource.fields.ssh_key,
        timeout: 10000, // 10s timeout
      })

      await client.disconnect()

      log.info({ resourceId: resource.id }, 'SSH validation succeeded')

      return {
        valid: true,
        message: 'SSH connection successful',
        timestamp: new Date()
      }
    } catch (error) {
      log.error({ error, resourceId: resource.id }, 'SSH validation failed')

      return {
        valid: false,
        message: `SSH connection failed: ${error.message}`,
        timestamp: new Date()
      }
    }
  }
}

// packages/api/src/resources/registry.ts
export const resourceTypeRegistry = {
  [ResourceType.WEBSITE]: websiteResourceType,
  [ResourceType.API_ENDPOINT]: apiEndpointResourceType,
  [ResourceType.DATABASE]: databaseResourceType,
}
```

**Integration with Field Types:**

Each resource type gets a corresponding field type:

```typescript
// packages/api/src/fields/website-reference.ts
export const websiteReferenceFieldType: FieldTypeBackendHandler = {
  configSchema: z.object({
    // Field config (if any)
  }),

  validate: async (value, config) => {
    // value is the resource ID
    const resource = await db.query.resources.findFirst({
      where: eq(resources.id, value.resourceId)
    })

    if (!resource) {
      return { valid: false, message: 'Resource not found' }
    }

    // Delegate to resource validator
    const resourceHandler = resourceTypeRegistry[ResourceType.WEBSITE]
    const validationResult = await resourceHandler.validate(resource)

    if (!validationResult.valid) {
      return {
        valid: false,
        message: `Resource "${resource.name}" validation failed: ${validationResult.message}`
      }
    }

    return { valid: true }
  }
}
```

**Background Validation:**

Resource validation runs as background jobs to avoid blocking:

```typescript
// packages/api/src/jobs/resource-validation.ts
import { queue } from './queue'

export async function queueResourceValidation(resourceId: string) {
  await queue.send('validate-resource', { resourceId })
}

// Job handler
queue.work('validate-resource', async (job) => {
  const { resourceId } = job.data

  const resource = await loadResource(resourceId)
  const handler = resourceTypeRegistry[resource.type]
  const result = await handler.validate(resource)

  // Store validation result
  await db.update(resources)
    .set({
      validationStatus: result.valid ? 'valid' : 'invalid',
      validationMessage: result.message,
      lastValidatedAt: result.timestamp
    })
    .where(eq(resources.id, resourceId))
})
```

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Naming Conventions

**Database:**
- Tables: plural snake_case (`card_types`, `card_type_field_configs`)
- Columns: snake_case (`card_type_id`, `default_value`, `created_at`)
- Foreign keys: `{referenced_table_singular}_id` (e.g., `project_id`, `field_id`)
- Junction tables: `{table1}_{table2}` (e.g., `card_type_field_configs`)
- Enums: singular snake_case (`field_type`, `resource_type`, `requirement`)

**API (ORPC):**
- Routers: plural camelCase (`projects`, `cardTypes`, `fieldStatusRequirements`)
- Procedures: verb + noun camelCase (`createProject`, `updateCardType`, `validateField`)
- Input types: `{ProcedureName}Input` (e.g., `CreateProjectInput`)
- Output types: `{ProcedureName}Output` or direct entity type

**TypeScript:**
- Types/Interfaces: PascalCase (`FieldType`, `CardValidator`, `ResourceValidator`)
- Enums: PascalCase name, SCREAMING_SNAKE_CASE values (`FieldType.TEXT`, `FieldType.WEBSITE_REFERENCE`)
- Functions: camelCase (`validateCard`, `getFieldComponent`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`, `DEFAULT_TIMEOUT`)

**React:**
- Files: kebab-case (`kanban-board.tsx`, `card-detail-modal.tsx`)
- Components: PascalCase (`KanbanBoard`, `CardDetailModal`)
- Props types: `{ComponentName}Props`
- Hooks: camelCase with `use` prefix (`useCardValidation`, `useFieldRegistry`)

**Field & Resource Types:**
- Enum values: SCREAMING_SNAKE_CASE with underscores (`WEBSITE_REFERENCE`, `API_REFERENCE`, `MULTI_SELECT`)
- Implementation files: kebab-case matching enum (`website-reference.ts`, `api-endpoint.ts`)

### Code Organization

**Test Files:**
- Co-located with source: `validator.test.ts` next to `validator.ts`
- Pattern: `{filename}.test.ts`

**Components:**
- By feature, not by type
- Example: `components/board/` contains all board-related components
- Shared primitives in `components/ui/` (shadcn/ui)

**API Routers:**
- One router per entity/domain (`projects.ts`, `cards.ts`)
- Use `router.merge()` in `index.ts` to compose

**Field & Resource Types:**
- Backend: One file per type in `packages/api/src/fields/` or `packages/api/src/resources/`
- Frontend: One file per field type in `apps/web/src/components/fields/`
- Registry files: `registry.ts` in each location

### Data Exchange Formats

**API Responses:**
- Success: Return data directly (no wrapper)
- Lists: Return array directly, or `{ items, total }` if paginated
- Errors: ORPC handles with standard error format

**Error Handling:**
- Use ORPC errors: `throw new ORPCError('NOT_FOUND', 'Card not found')`
- Standard codes: `NOT_FOUND`, `FORBIDDEN`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`

**Dates:**
- Database: PostgreSQL timestamp with timezone
- API: ISO 8601 strings (`toISOString()`)
- UI: Format with `Intl.DateTimeFormat` or date-fns

**Validation Results:**
```typescript
type ValidationResult = {
  valid: boolean
  errors: Array<{
    field: string
    message: string
    code?: string
  }>
}
```

**Resource Validation:**
```typescript
type ResourceValidationResult = {
  valid: boolean
  message: string
  timestamp: Date
}
```

### State Management Patterns

**Server State (React Query):**
- Use for all API data (projects, cards, resources)
- Enable optimistic updates for mutations
- Cache invalidation on related mutations

**UI State (useState/useReducer):**
- Use for ephemeral UI state (modals, filters, drag preview)
- Keep separate from server state

**Form State (React Hook Form):**
- Dynamic field rendering with field type registry
- Async validation integration
- Pre-filled values from server

**Example - Card Move with Optimistic Update:**
```typescript
const moveCardMutation = useMutation({
  mutationFn: (input) => orpcClient.cards.moveCard(input),
  onMutate: async (input) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['cards', projectId])

    // Snapshot previous value
    const previous = queryClient.getQueryData(['cards', projectId])

    // Optimistically update UI
    queryClient.setQueryData(['cards', projectId], (old) =>
      updateCardStatus(old, input.cardId, input.targetStatusId)
    )

    return { previous }
  },
  onError: (err, input, context) => {
    // Rollback on error
    queryClient.setQueryData(['cards', projectId], context.previous)
    toast.error('Failed to move card')
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries(['cards', projectId])
  }
})
```

### Background Job Patterns

**Queue Job:**
```typescript
import { queue } from '@/jobs/queue'

// In API router
await queue.send('validate-resource', {
  resourceId,
  triggeredBy: ctx.user.id
})
```

**Process Job:**
```typescript
// In job handler file
queue.work('validate-resource', async (job) => {
  const log = createLogger('ResourceValidationJob')
  const { resourceId } = job.data

  log.info({ resourceId }, 'Starting resource validation')

  try {
    // Validation logic
    const result = await validateResource(resourceId)

    // Update database
    await updateResourceValidation(resourceId, result)

    log.info({ resourceId, valid: result.valid }, 'Validation complete')
  } catch (error) {
    log.error({ error, resourceId }, 'Validation failed')
    throw error  // pg-boss handles retry
  }
})
```

**Job Configuration:**
- Default retry: 3 attempts with exponential backoff
- Timeout: 30 seconds for validation jobs
- Failed jobs logged for debugging

### Logging Patterns

**Setup:**
```typescript
// packages/api/src/lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined
})

export const createLogger = (module: string) => {
  return logger.child({ module })
}
```

**Usage:**
```typescript
import { createLogger } from '@/lib/logger'
const log = createLogger('CardValidator')

log.info({ cardId, statusId }, 'Validating card for transition')
log.warn({ cardId, missingFields }, 'Missing required fields')
log.error({ error, cardId }, 'Validation failed')
log.debug({ schema }, 'Schema loaded')
```

**Logging Levels:**
- `error` - Failures needing attention
- `warn` - Unexpected but handled situations
- `info` - Important events (card created, validation passed)
- `debug` - Detailed flow (disabled in production)

**Always Include Context:**
- Relevant IDs: `projectId`, `cardId`, `userId`, `fieldId`
- Error objects: Full error with stack trace
- Timing: For performance-critical operations

### Security Patterns

**Authentication:**
- All routes except auth use Better-Auth session validation
- ORPC context includes authenticated user

**Authorization:**
- Global admin: System admins (`user.role === "admin"`) bypass all project-level checks
- Project-scoped: Use centralized helpers in `packages/api/src/lib/authz/project.server.ts`
- Role hierarchy: System Admin > Project Owner > Project Admin > Project Member
- Permission checks: Use `requireProjectRole()`, `requireCanDelete()`, etc.

**Resource Credentials:**
- Encrypt at rest: Use `pgcrypto` or application-level encryption
- Mask in UI: Show only last 4 characters
- Never log: Exclude from structured logs

**File Uploads:**
- Validate file types and sizes
- Use presigned URLs for direct S3 uploads
- Scan files for malware (future enhancement)

**Input Validation:**
- All ORPC inputs validated with Zod schemas
- Field values validated by field type handlers
- SQL injection prevented by Drizzle parameterization

### Performance Patterns

**Database:**
- Index on foreign keys: `project_id`, `card_type_id`, `status_id`, etc.
- Index on search fields: `cards.title`, `projects.name`
- Composite indexes for common queries: `(project_id, status_id)` on cards

**Board Loading:**
- Fetch only visible columns initially
- Use React Query caching
- Virtualize if >100 cards per column

**Real-time Search:**
- Debounce input (300ms)
- Client-side filtering for cached data
- Server-side search for fresh results

**Optimistic Updates:**
- Show immediate feedback for user actions
- Rollback on server error
- Background sync to keep consistent

## Data Architecture

### Core Entities

**Projects & Access Control:**
```typescript
projects {
  id: uuid (pk)
  name: string (unique per user)
  description: text
  owner_id: uuid (fk → user.id)
  created_at: timestamp
  updated_at: timestamp
}

project_members {
  id: uuid (pk)
  project_id: uuid (fk → projects.id)
  user_id: uuid (fk → user.id)
  role: enum('owner', 'admin', 'member')
  invited_by: uuid (fk → user.id)
  joined_at: timestamp

  unique(project_id, user_id)
}
```

**Global Workflow Configuration (System Admin Only):**
```typescript
statuses {
  id: uuid (pk)
  // No project_id - statuses are GLOBAL
  name: string
  color: string
  order: int
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
  created_by: uuid (fk → user.id)
}

card_types {
  id: uuid (pk)
  // No project_id - card types are GLOBAL
  name: string
  key: string  // GLOBALLY unique (e.g., "BUG", "FEAT")
  color: string
  icon: string
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
  created_by: uuid (fk → user.id)
}

fields {
  id: uuid (pk)
  // NO card_type_id - fields are GLOBAL and reusable across card types
  name: string
  field_type: enum (FieldType)
  config: jsonb  // Type-specific validation config
  default_value: jsonb  // Default value for this field
  created_at: timestamp
  updated_at: timestamp
  created_by: uuid (fk → user.id)
}

card_type_field_configs {
  id: uuid (pk)
  card_type_id: uuid (fk → card_types.id)
  status_id: uuid (fk → statuses.id)
  field_id: uuid (fk → fields.id)
  requirement: enum('required', 'optional')  // NO 'hidden' - fields are either on the card or not
  display_order: int  // Order of field display for this card type + status

  unique(card_type_id, status_id, field_id)
}
```

**Cards:**
```typescript
cards {
  id: uuid (pk)
  project_id: uuid (fk → projects.id)
  card_type_id: uuid (fk → card_types.id)
  status_id: uuid (fk → statuses.id)
  title: string
  order: int  // Position within status column
  assignee_id: uuid (fk → user.id, nullable)
  created_by: uuid (fk → user.id)
  created_at: timestamp
  updated_at: timestamp
}

card_field_values {
  id: uuid (pk)
  card_id: uuid (fk → cards.id)
  field_id: uuid (fk → fields.id)
  value: jsonb  // Stores value in type-specific format

  unique(card_id, field_id)
}
```

**Resources:**
```typescript
resources {
  id: uuid (pk)
  project_id: uuid (fk → projects.id)
  resource_type: enum (ResourceType)
  name: string
  description: text
  validation_status: enum('valid', 'invalid', 'pending', 'not_validated')
  validation_message: text
  last_validated_at: timestamp
  created_by: uuid (fk → user.id)
  created_at: timestamp
  updated_at: timestamp
}

resource_field_values {
  id: uuid (pk)
  resource_id: uuid (fk → resources.id)
  field_name: string  // e.g., "ssh_host", "api_key"
  value: jsonb  // Encrypted if sensitive

  unique(resource_id, field_name)
}
```

**Comments & Activity:**
```typescript
comments {
  id: uuid (pk)
  card_id: uuid (fk → cards.id)
  user_id: uuid (fk → user.id)
  content: text  // Markdown
  created_at: timestamp
  updated_at: timestamp
}

activity_log {
  id: uuid (pk)
  card_id: uuid (fk → cards.id)
  user_id: uuid (fk → user.id)
  action: enum('created', 'updated', 'moved', 'assigned')
  field_name: string (nullable)  // For field updates
  old_value: jsonb (nullable)
  new_value: jsonb (nullable)
  created_at: timestamp

  // Immutable - no updates or deletes
}
```

**Notifications:**
```typescript
user_telegram {
  id: uuid (pk)
  user_id: uuid (fk → user.id)
  chat_id: string
  linked_at: timestamp

  unique(user_id)
}

notification_config {
  id: uuid (pk)
  project_id: uuid (fk → projects.id)
  trigger_type: enum('status_transition', 'assignment')
  status_id: uuid (fk → statuses.id, nullable)  // For status transitions
  enabled: boolean
  created_at: timestamp
}
```

### Key Relationships

- **Global entities (System Admin only):** Statuses, CardTypes, Fields, FieldStatusRequirements
- Projects have many: Cards, Members, Resources
- CardTypes have many: Fields (global, not project-scoped)
- Cards belong to: Project, CardType (global), Status (global), User (assignee)
- Cards have many: FieldValues, Comments, ActivityLogs
- Fields define: FieldType, Config, DefaultValue, StatusRequirements
- Resources belong to: Project, have ResourceType, have validation status
- All projects share the same global workflow schema

### Indexes

**High Priority (Performance Critical):**
```sql
CREATE INDEX idx_cards_project_status ON cards(project_id, status_id);
CREATE INDEX idx_cards_title ON cards USING gin(to_tsvector('english', title));
CREATE INDEX idx_card_field_values_card ON card_field_values(card_id);
CREATE INDEX idx_card_type_field_configs_card_type ON card_type_field_configs(card_type_id);
CREATE INDEX idx_card_type_field_configs_status ON card_type_field_configs(card_type_id, status_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_resources_project ON resources(project_id);
CREATE INDEX idx_comments_card ON comments(card_id);
CREATE INDEX idx_activity_log_card ON activity_log(card_id);
```

## API Contracts

### Authentication Context

All ORPC procedures (except public) include authenticated user in context:

```typescript
type Context = {
  user: User  // From Better-Auth session
  db: Database  // Drizzle instance
}
```

### Project Routers

**projects router:**
- `createProject(input: { name, description? })` → Project
- `updateProject(input: { projectId, name?, description? })` → Project
- `deleteProject(input: { projectId })` → void
- `listProjects()` → Project[]
- `inviteUser(input: { projectId, userId })` → ProjectMember
- `transferOwnership(input: { projectId, newOwnerId })` → Project

**statuses router (SYSTEM ADMIN ONLY):**
- `createStatus(input: { name, color, order })` → Status
- `updateStatus(input: { statusId, name?, color?, order?, isActive? })` → Status
- `deleteStatus(input: { statusId })` → void (fails if cards exist)
- `listStatuses()` → Status[]  // All statuses (admin view)
- `listActiveStatuses()` → Status[]  // Public read (active only)
- `reorderStatuses(input: { statusIds[] })` → Status[]

**cardTypes router (SYSTEM ADMIN ONLY):**
- `createCardType(input: { name, key, color, icon })` → CardType
- `updateCardType(input: { cardTypeId, name?, key?, color?, icon?, isActive? })` → CardType
- `deleteCardType(input: { cardTypeId })` → void (fails if cards exist)
- `listCardTypes()` → CardType[]  // All card types (admin view)
- `listActiveCardTypes()` → CardType[]  // Public read (active only)

**fields router:**
- `createField(input: { cardTypeId, name, fieldType, config?, defaultValue?, order })` → Field
- `updateField(input: { fieldId, name?, config?, defaultValue?, order? })` → Field
- `deleteField(input: { fieldId })` → void
- `listFields(input: { cardTypeId })` → Field[]
- `setFieldRequirement(input: { fieldId, statusId, requirement })` → FieldStatusRequirement

**cards router:**
- `createCard(input: { projectId, cardTypeId, statusId, title, fieldValues? })` → Card
- `updateCard(input: { cardId, title?, fieldValues? })` → Card
- `moveCard(input: { cardId, targetStatusId, fieldValues? })` → Card (validates before move)
- `reorderCard(input: { cardId, newOrder })` → Card
- `deleteCard(input: { cardId })` → void
- `listCards(input: { projectId, statusId?, cardTypeId?, search? })` → Card[]
- `getCard(input: { cardId })` → Card (with all field values)

**resources router:**
- `createResource(input: { projectId, resourceType, name, description, fieldValues })` → Resource
- `updateResource(input: { resourceId, name?, description?, fieldValues? })` → Resource
- `deleteResource(input: { resourceId })` → void (fails if referenced)
- `listResources(input: { projectId, resourceType? })` → Resource[]
- `validateResource(input: { resourceId })` → void (queues validation job)

**comments router:**
- `createComment(input: { cardId, content })` → Comment
- `updateComment(input: { commentId, content })` → Comment
- `deleteComment(input: { commentId })` → void
- `listComments(input: { cardId })` → Comment[]

**notifications router:**
- `linkTelegram(input: { chatId })` → UserTelegram
- `unlinkTelegram()` → void
- `createNotificationConfig(input: { projectId, triggerType, statusId? })` → NotificationConfig
- `deleteNotificationConfig(input: { configId })` → void
- `listNotificationConfigs(input: { projectId })` → NotificationConfig[]

### Error Responses

Standard ORPC error format:
```typescript
{
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR',
  message: string,
  data?: {
    errors?: ValidationError[]  // For validation failures
  }
}
```

## Security Architecture

**Authentication:**
- Better-Auth session-based authentication (existing)
- Session validation on every ORPC call
- User object in ORPC context

**Authorization:**
- Two-tier admin system:
  - System Admin: Global role via Better Auth (`user.role = "admin"`), can access any project
  - Project Admin: Project-scoped role (`project_members.role = "admin"`), elevated permissions within project
- Project roles: owner (full control), admin (manage but not delete/transfer), member (read + cards)
- See Permission Matrix section below for complete breakdown

**Data Protection:**
- Resource credentials encrypted at rest (pgcrypto or app-level)
- Sensitive fields masked in UI (show last 4 chars)
- API keys/passwords never logged

**Input Validation:**
- Zod schemas on all ORPC inputs
- Field type validators for card field values
- SQL injection prevented by Drizzle ORM

**File Upload Security:**
- Presigned URLs for direct S3 upload (no server relay)
- File type and size validation
- Malware scanning (future enhancement)

**CSRF Protection:**
- Built into Next.js + ORPC
- Session cookies with SameSite=Lax

### Authorization & Permission Matrix

#### Role Definitions

| Role | Scope | Definition | Source |
|------|-------|------------|--------|
| **System Admin** | Global | Full system access, can access any project | `user.role === "admin"` via Better Auth admin plugin |
| **Project Owner** | Project | Creator or transferred owner, full project control | `project_members.role = "owner"` |
| **Project Admin** | Project | Elevated member, can manage but not delete/transfer | `project_members.role = "admin"` |
| **Project Member** | Project | Regular member, read access + card operations | `project_members.role = "member"` |

#### Project Permission Matrix

| Permission | System Admin | Owner | Admin | Member |
|------------|:------------:|:-----:|:-----:|:------:|
| PROJECT_READ | ✓ | ✓ | ✓ | ✓ |
| PROJECT_UPDATE | ✓ | ✓ | ✓ | ✗ |
| MEMBERS_INVITE | ✓ | ✓ | ✓ | ✗ |
| MEMBERS_REMOVE | ✓ | ✓ | ✓ | ✗ |
| MEMBERS_CHANGE_ROLE | ✓ | ✓ | ✓ | ✗ |
| PROJECT_TRANSFER_OWNERSHIP | ✓ | ✓ | ✗ | ✗ |
| PROJECT_DELETE | ✓ | ✓ | ✗ | ✗ |
| PROJECT_ARCHIVE | ✓ | ✓ | ✗ | ✗ |
| CARDS_MANAGE | ✓ | ✓ | ✓ | ✓ |
| RESOURCES_MANAGE | ✓ | ✓ | ✓ | ✓ |

#### Global Schema Permissions (System Admin Only)

| Permission | System Admin | Regular User |
|------------|:------------:|:------------:|
| STATUSES_READ | ✓ | ✓ |
| STATUSES_MANAGE | ✓ | ✗ |
| CARD_TYPES_READ | ✓ | ✓ |
| CARD_TYPES_MANAGE | ✓ | ✗ |
| FIELDS_READ | ✓ | ✓ |
| FIELDS_MANAGE | ✓ | ✗ |

**Note:** Statuses, Card Types, Fields, and Field Requirements are GLOBAL entities managed exclusively by System Administrators. All projects share the same workflow schema.

#### Implementation Reference

- **Permission definitions**: `packages/api/src/lib/authz/project.ts`
- **Server enforcement**: `packages/api/src/lib/authz/project.server.ts`
- **Auth plugin**: `packages/auth/src/index.ts` (Better Auth admin plugin)

## Performance Considerations

**Database:**
- Indexes on all foreign keys and search fields
- Composite indexes for common queries: `(project_id, status_id)` on cards
- Connection pooling via Drizzle

**Board Loading:**
- Target: <2s for 1000+ cards
- Strategy: React Query caching + optimistic updates
- Virtualization if >100 cards per column (react-window or similar)

**Real-time Search:**
- Debounce input (300ms)
- Client-side filtering on cached data
- Server-side for fresh results

**Drag & Drop:**
- Target: 60fps during drag operations
- Use CSS transforms (GPU accelerated)
- Optimistic position updates

**File Uploads:**
- Direct to S3 via presigned URLs (no server bottleneck)
- Client-side progress tracking
- Parallel uploads for multiple files

**Background Jobs:**
- Async validation runs in pg-boss workers
- Non-blocking for user experience
- Timeout handling (5s async validation, 10s resource validation)

## Deployment Architecture

**Development:**
- Local: `bun run dev` (Next.js dev server + hot reload)
- Database: PostgreSQL in Docker Compose
- S3: s3rver (npm package, local filesystem)
- Background jobs: pg-boss (same PostgreSQL instance)

**Production (Recommended):**
- **Application**: Vercel (Next.js native support)
- **Database**: Neon, Supabase, or Railway (managed PostgreSQL)
- **File Storage**: Cloudflare R2 or AWS S3
- **Background Jobs**: pg-boss (same database, needs long-running process)
  - Option 1: Railway/Fly.io for worker process
  - Option 2: Vercel cron jobs (limited to 15 min tasks)
- **Telegram Bot**: Long-polling or webhook (deploy worker separately)

**Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://...

# Better-Auth
AUTH_SECRET=...
AUTH_URL=...

# S3 Storage
S3_ENDPOINT=...
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...

# Telegram
TELEGRAM_BOT_TOKEN=...

# Logging
LOG_LEVEL=info

# Optional
NODE_ENV=production
```

## Development Environment

### Prerequisites

- **Bun** 1.3.1+ (package manager)
- **Node.js** 18+ (runtime compatibility)
- **PostgreSQL** (via Docker Compose)
- **Git** (version control)

### Setup Steps

1. **Clone and Install:**
```bash
git clone <repository>
cd planner
bun install
```

2. **Environment Configuration:**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

3. **Start Database:**
```bash
bun run db:start  # Starts PostgreSQL via Docker Compose
```

4. **Run Migrations:**
```bash
bun run db:push  # Push schema to database (dev)
# OR
bun run db:generate && bun run db:migrate  # Generate + run migrations (production-like)
```

5. **Start Development Server:**
```bash
bun run dev  # Starts Next.js on port 3001
```

6. **Start s3rver (for file uploads):**
```bash
bun run s3:dev  # Starts s3rver on port 9000
```

### Development Scripts

```bash
# Development
bun run dev                 # Start dev server
bun run dev:api            # Start API only
bun run dev:web            # Start web only

# Database
bun run db:start           # Start PostgreSQL container
bun run db:stop            # Stop PostgreSQL container
bun run db:push            # Push schema changes (dev)
bun run db:generate        # Generate migrations
bun run db:migrate         # Run migrations
bun run db:studio          # Open Drizzle Studio (GUI)

# Storage
bun run s3:dev             # Start s3rver for local file storage

# Code Quality
bun run check              # Lint and format with Biome
bun run check:fix          # Auto-fix lint issues
bun run check-types        # TypeScript type checking

# Build
bun run build              # Build all packages
bun run build:web          # Build web app only
bun run build:api          # Build API package only

# Testing (to be added)
bun run test               # Run all tests
bun run test:watch         # Watch mode
```

### Docker Compose Services

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: planner
      POSTGRES_PASSWORD: planner
      POSTGRES_DB: planner
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Code Quality Standards

See `.claude/CLAUDE.md` (Ultracite preset) for detailed standards:
- TypeScript strict mode
- Biome for linting and formatting
- Explicit types for clarity
- Modern JavaScript/TypeScript patterns
- React 19 best practices

## Architecture Decision Records (ADRs)

### ADR-001: Field Type Registry System

**Status:** Accepted

**Context:** Dynamic card types require runtime-configurable fields with different validation and rendering logic. Each field type needs both backend validation and frontend UI components.

**Decision:** Implement dual registry pattern with shared TypeScript enum. Backend registry provides validators, frontend registry provides React components. Enum enforces completeness at compile-time.

**Consequences:**
- ✅ Type safety ensures no missing implementations
- ✅ Fallback components prevent runtime crashes
- ✅ Easy to add new field types
- ❌ Requires implementing both backend and frontend for each type

### ADR-002: Single Validation Orchestrator

**Status:** Accepted

**Context:** Cards have multi-layered validation (sync, async, resource, conditional). Initial design had separate methods for each type, creating complexity.

**Decision:** Single `validate()` method that internally runs all validators. Field types encapsulate their own sync/async behavior. Resource validation delegated through field types.

**Consequences:**
- ✅ Simpler API for consumers
- ✅ Easier to add new validation types
- ✅ Field types own their validation logic
- ⚠️ May be slower for simple validations (always runs full pipeline)

### ADR-003: pg-boss for Background Jobs

**Status:** Accepted

**Context:** Need background processing for async validation and Telegram notifications. Options: BullMQ (requires Redis), Inngest (external service), pg-boss (PostgreSQL-based).

**Decision:** Use pg-boss leveraging existing PostgreSQL database.

**Consequences:**
- ✅ No additional infrastructure (Redis, etc.)
- ✅ Simpler development setup
- ✅ Transactional job queueing
- ❌ Less feature-rich than BullMQ
- ❌ Scales with database (not independently)

### ADR-004: Hybrid Data Storage for Field Configurations

**Status:** Accepted

**Context:** Field definitions need structure (for queries) and flexibility (for type-specific config).

**Decision:** Store core fields relationally (`fields` table), store type-specific config in JSONB (`config`, `default_value` columns). Drizzle provides type safety for relational part, JSONB for flexibility.

**Consequences:**
- ✅ Type safety where it matters
- ✅ Flexibility for diverse field types
- ✅ Queryable core structure
- ⚠️ JSONB queries less performant than columns
- ⚠️ JSONB validation at application level

### ADR-005: Resource Credentials Encryption

**Status:** Accepted

**Context:** Resources store sensitive credentials (SSH keys, API tokens, database passwords).

**Decision:** Encrypt sensitive fields at rest using pgcrypto or application-level encryption. Mask in UI (show last 4 chars). Never log.

**Consequences:**
- ✅ Secure storage of credentials
- ✅ Compliance-friendly
- ❌ Performance overhead for encryption/decryption
- ⚠️ Key management required

### ADR-006: React Query for State Management

**Status:** Accepted

**Context:** Board UI needs server state caching, optimistic updates, and real-time feel. Options: Redux (heavy), Zustand (client-focused), React Query (server-focused).

**Decision:** React Query for server state, React useState for UI state. Leverages ORPC integration.

**Consequences:**
- ✅ Perfect fit for server-heavy state
- ✅ Built-in optimistic updates
- ✅ Works seamlessly with ORPC
- ✅ Automatic caching and invalidation
- ⚠️ Learning curve for optimistic update patterns

### ADR-007: Pino for Structured Logging

**Status:** Accepted

**Context:** Need structured logging for debugging and production monitoring. Options: Winston (popular), Pino (fast), console.log (insufficient).

**Decision:** Use Pino with JSON output. Pretty-print in development, JSON in production.

**Consequences:**
- ✅ Fast performance (important for validation operations)
- ✅ Structured JSON logs (aggregation-ready)
- ✅ TypeScript support
- ✅ Works well with Bun
- ⚠️ Requires log aggregation service in production

### ADR-008: s3rver for Local Development

**Status:** Accepted

**Context:** Need S3-compatible storage for file uploads. Don't want to require AWS account for local dev. Options: MinIO (Docker), LocalStack (Docker), s3rver (npm).

**Decision:** Use s3rver (npm package) for local development. Minimal setup, fits existing Node.js/Bun ecosystem.

**Consequences:**
- ✅ Lightweight (no Docker container needed)
- ✅ Simple `bun run s3:dev` script
- ✅ S3-compatible API
- ❌ Less complete S3 emulation than MinIO
- ⚠️ Stores files locally (not persistent by default)

---

**Generated by BMAD Decision Architecture Workflow v1.3.2**
**Date:** 2025-11-10
**For:** BMad
