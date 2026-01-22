# planner - Product Requirements Document

**Author:** BMad
**Date:** 2025-11-10
**Version:** 1.0

---

## Executive Summary

Internal process management tool for ensuring work items have all required information before moving to the next stage. Teams configure their workflows with custom card types, statuses, and field requirements. System enforces validation when cards transition between stages.

---

## Project Classification

**Technical Type:** Web Application
**Domain:** Process Management
**Complexity:** Medium

Built on: Next.js 16, React 19, ORPC, PostgreSQL, Drizzle ORM, Better-Auth

---

## Success Criteria

- System administrators configure global workflows in under 10 minutes
- 90% of transitions complete without validation errors
- External validations succeed 95%+ of the time
- Board loads in under 2 seconds with 1000+ cards
- Transitions complete in under 1 second (sync), under 5 seconds (async)

---

## Access Control

**System Administrator (global role):**
- Access all projects system-wide
- Manage global workflow schema (statuses, card types, fields, field requirements)
- Invite users to any project
- Delete any project

**Project Owner (creator):**
- Invite users to project
- Transfer ownership to another member
- Full card permissions (create/edit/move)
- Create and manage resources
- View global workflow schema (read-only)

**Project Admin:**
- Invite users to project
- Full card permissions (create/edit/move)
- Create and manage resources
- View global workflow schema (read-only)

**Project Member:**
- Create, edit, move cards
- Create and manage resources
- View global workflow schema (read-only)
- Cannot invite users or configure project

**Access rules:**
- Users see only projects they're members of
- Global workflow schema (statuses, card types, fields) is shared across all projects
- Authentication via existing Better-Auth system

---

## Functional Requirements

### 1. Project Management

**Create Project:**
- Name (required, unique per user)
- Description (optional)
- Creator becomes project owner

**Project Settings:**
- Edit name and description
- View members list
- Transfer ownership (owner/admin only)
- Delete project (admin only)

**User Invitation:**
- Owner/admin can invite users by email or username
- Invited user gains member access immediately
- No approval workflow

---

### 2. Workflow Configuration (System Admin Only)

**Note:** All workflow configuration is GLOBAL and managed exclusively by System Administrators. All projects share the same workflow schema.

**Status Management (System Admin Only):**
- Create status with name and color
- Reorder statuses via drag-and-drop
- Edit status name and color
- Activate/deactivate statuses
- Delete status (only if no cards in that status)
- Default statuses provided by system: Backlog, In Progress, Done

**Card Type Management (System Admin Only):**
- Create card type with name, key (e.g., "BUG"), color, and icon
- Edit card type properties
- Activate/deactivate card types
- Delete card type (only if no cards of that type exist)
- Card types define the structure and field requirements

**Field Configuration (System Admin Only):**
- Define fields for each card type (global)
- Set field requirements per status (required or optional)
- Configure validation rules per field
- Set default values for fields
- Fields can be conditionally required based on other field values

**Default Field Values:**
- When configuring a card type, set default values for any field
- Example: Bug cards have "Description" field pre-filled with "Steps to reproduce:\n1.\n2.\n3."
- When user creates card of that type, field is pre-filled with default value
- User can edit/override default value
- Applies to: text, number, dropdown, date, and other field types

---

### 3. Field Types and Validation

**Text Field:**
- Single line or multi-line
- Min/max length validation
- Regex pattern validation (optional)
- Default value support

**Rich Text Field:**
- Markdown or WYSIWYG editor
- Supports formatting, lists, links
- Default value support

**Number Field:**
- Integer or decimal
- Min/max value validation
- Step increment
- Default value support

**Date Field:**
- Date picker
- Date range validation (min/max dates)
- Relative dates (e.g., "must be future date")
- Default value support

**Dropdown (Single Select):**
- Predefined list of options
- Display name and value
- Color coding per option (optional)
- Default value support (pre-selected option)

**Multi-Select:**
- Select multiple values from predefined list
- Min/max selection count
- Default value support (pre-selected options)

**User Assignment:**
- Select user from project members
- Single user only
- Default value support (pre-assigned user)

**File Attachment:**
- Upload files to card
- File type restrictions (optional)
- Max file size limit
- Multiple files per card

**Resource Reference:**
- Select from resource instances defined in project
- Resource must be validated for transition to succeed (if field is required)
- Can reference invalid resource, but blocks status transition
- Multiple resource references per card (if configured)

---

### 4. Resources

**Resource Types:**
- Defined in code by developers (e.g., Website, Server, Database, API Endpoint)
- Each type has specific fields and validation logic
- Example: Website type has fields: url, ssh_host, ssh_user, ssh_key
- Example validation: SSH connection test

**Resource Instances:**
- Created by any project member within a project
- Scoped to project (not shared across projects)
- Has name and description (common fields)
- Has type-specific fields based on resource type
- Has validation status: valid, invalid, pending, not validated

**Resource Creation:**
- Select resource type from available types
- Fill in name, description, and type-specific fields
- System runs validation immediately
- Resource saved with validation status

**Resource Validation:**
- Runs on resource creation
- Runs on resource update
- Runs during card status transitions (re-validates referenced resources)
- Validation logic defined in code per resource type
- Returns: valid/invalid + message

**Resource Usage in Cards:**
- Add "Resource Reference" field to card type
- Configure which resource type(s) can be selected
- User selects resource instance from dropdown
- Card can reference invalid resource
- If status requires resource field and resource is invalid → transition blocked
- Error message: "Resource [name] validation failed: [error message]"

**Resource Management:**
- List all resources in project
- Edit resource fields
- Delete resource (only if not referenced by any card)
- Manual "Validate Now" button to re-run validation
- View validation history/status

**Example Resource Types (implemented in code):**

**Website:**
- Fields: url, ssh_host, ssh_port, ssh_user, ssh_key
- Validation: Test SSH connection and login

**API Endpoint:**
- Fields: url, auth_type, api_key, headers
- Validation: Test HTTP request and check response status

**Database:**
- Fields: host, port, database_name, username, password, connection_string
- Validation: Test database connection

---

### 5. Validation Types

**Synchronous Validation (instant):**
- Required field checks
- Format validation (email, URL, phone)
- Length constraints (min/max characters)
- Number range validation
- Date range validation
- Dropdown selection required
- Results appear instantly (<100ms)

**Asynchronous Validation (external API):**
- Call external system to validate field value
- Examples: ticket ID verification, budget code validation, customer ID lookup
- Show loading spinner during validation
- Timeout after 5 seconds with retry option
- Display success indicator or error message from external system
- Transition blocked until validation passes

**Conditional Validation:**
- Field required only if another field has specific value
- Example: "Steps to Reproduce" required only if Priority is High or Critical
- Fields show/hide based on conditional logic
- Conditions evaluate on field value change

**Custom Validation:**
- Regex patterns for format validation
- Cross-field validation (e.g., "End Date must be after Start Date")
- Custom error messages

**Resource Validation:**
- Validates resource instance using type-specific logic
- Runs on resource create/update and during card transitions
- Blocks transition if required resource field references invalid resource

---

### 6. Card Operations

**Create Card:**
- Click "Add Card" from any status column
- Select card type from dropdown
- Enter title (always required)
- Fill fields required for initial status
- Fields with default values are pre-filled
- Save card - appears immediately in selected status

**View Card:**
- Click card to open detail view (modal or side panel)
- Display all fields organized in sections
- Show card metadata: created date, creator, last updated
- Display activity history
- Show comments
- Show referenced resources with validation status

**Edit Card:**
- Click "Edit" in card detail view
- Modify field values
- See which fields are required for current status (marked with *)
- Changes save on "Save" click or auto-save
- Validation errors show inline per field

**Move Card (Status Transition):**
- User drags card from one status column to another
- System checks if all required fields for target status are filled and valid

**If fields missing or validation fails:**
1. Show transition dialog: "Complete these fields to move to [Status Name]"
2. Display form with missing/invalid required fields
3. Show current values for fields already filled (editable)
4. If resource reference field: show resource validation status
5. User fills missing fields
6. System runs validation (sync, async, resource)
7. User clicks "Move to [Status Name]" button
8. If validation passes: card transitions to new status
9. If validation fails: show errors, block transition

**If all fields complete and valid:**
- Card moves immediately
- No dialog shown
- Visual feedback during transition

**Validation Errors:**
- Sync validation: instant inline errors
- Async validation: loading state, then success/error
- Resource validation: "Resource [name] is invalid: [message]"
- User can cancel transition - card stays in original status

**Reorder Cards:**
- Drag card up/down within same status column
- Updates card position
- No validation required

---

### 7. Board Interface

**Layout:**
- Horizontal columns for each status (left to right in status order)
- Column header shows status name, color, and card count
- Empty statuses show "Add Card" button

**Card Display:**
- Title
- Card type badge (colored, with icon and key)
- Assignee avatar (if assigned)
- Priority indicator (if applicable)
- Visual indicators for validation states (pending, error)

**Interactions:**
- Drag-and-drop cards between columns
- Drag to reorder within column
- Click card to open detail view
- Smooth animations during drag operations (60fps target)

**Filters and Search:**
- Search bar: filter by card title or field values (real-time)
- Filter dropdown: by card type, assignee, field values
- Filters apply immediately
- Clear filters button

**Performance:**
- Load board in under 2 seconds with 1000+ cards
- Virtualization for large card lists if needed
- Optimistic UI updates during card operations

---

### 8. Comments and Activity

**Card Comments:**
- Add comment to any card
- Markdown support for formatting
- @mention other project members
- Edit own comments
- Delete own comments
- Comments sorted newest first

**Activity History:**
- Log all card changes: field updates, status transitions, assignments
- Show: who, what changed, when
- Display old value → new value for field changes
- Activity sorted newest first
- Cannot be edited or deleted

---

### 9. Notifications (Telegram)

**Notification Triggers:**
- User assigned to a card
- Card transitions to specific status (configurable per project)

**Configuration:**
- Project owner configures which status transitions trigger notifications
- Example: notify when card moves to "Ready for Review" or "Done"
- Per-project notification settings

**User Setup:**
- User links their Telegram account to Planner account
- OAuth flow or bot command-based linking
- Store Telegram chat_id per user

**Notification Content:**
- Card title and type
- Action performed (assigned, transitioned to [status])
- Project name
- Link to card in Planner

**Delivery:**
- Send via Telegram bot
- Delivery within 10 seconds of trigger event
- Silent failure if user hasn't linked Telegram (no error shown to triggering user)
- Retry up to 3 times on network failure

---

### 10. Configuration Tools

**Visual Schema Editor:**
- Select card type
- Select status
- View list of fields for that card type
- Set field requirement: Required / Optional / Hidden
- Set default field values
- Drag to reorder fields
- Click field to configure validation rules
- Preview field rendering
- Save changes - take effect immediately for new cards

**Import/Export Configuration:**
- Export project configuration as JSON
- Includes: statuses, card types, fields, validation rules, default values, resources
- Import configuration into new project
- Validation before import (schema check)

**Duplicate Project:**
- Create new project from existing one
- Copies: statuses, card types, field configurations, default values
- Does not copy: cards, members, comments, resource instances
- User becomes owner of duplicated project

---

## Non-Functional Requirements

### Performance

- Board loads in under 2 seconds with 1000+ cards
- Card creation saves in under 500ms
- Status transitions complete in under 1 second (sync validation)
- Async validations complete within 5 seconds or timeout
- Resource validation completes within 10 seconds or timeout
- Drag-and-drop maintains 60fps
- Search results appear as user types (debounced, <300ms)
- No full page reloads during normal operations

### Security

- Authentication via existing Better-Auth
- Project-based access control enforced at API level
- Admin role verified server-side
- CSRF protection on all mutations
- SQL injection prevention via Drizzle ORM parameterized queries
- XSS prevention via React auto-escaping and DOMPurify for rich text
- File upload validation and scanning
- Resource credentials (SSH keys, passwords) encrypted at rest
- Sensitive resource fields masked in UI (show last 4 chars only)

### Accessibility

- Keyboard navigation for all interactions
- Screen reader compatibility (ARIA labels)
- Color contrast meets WCAG 2.1 AA standards
- Clear focus indicators
- Error messages announced to screen readers
- Tooltips for icon-only buttons
- Skip links for navigation

### Usability

- Mobile-responsive design
- Touch-friendly drag-and-drop on tablets
- Undo capability for accidental card moves
- Clear error messages with actionable guidance
- Consistent UI patterns across features
- Loading states for all async operations

### Reliability

- Database transactions for card transitions
- Optimistic UI updates with rollback on failure
- Graceful degradation if external validation systems are down
- Graceful degradation if resource validation fails (show error, allow retry)
- Retry mechanism for failed Telegram notifications (max 3 retries)
- Error logging for debugging

### Scalability

- Support 100+ projects
- Support 500+ users
- Support 10,000+ cards across all projects
- Support 1,000+ resource instances per project
- Efficient database indexing on frequently queried fields
- Pagination for large result sets

---

## Integration Requirements

### External Validation API

**Requirements:**
- Project owner configures external API endpoint per field
- HTTP REST API calls with configurable method (GET/POST)
- Pass field value as query param or JSON body
- Expect JSON response: `{ "valid": true/false, "message": "error or success text" }`
- Timeout after 5 seconds
- Retry once on network failure

**Example Integration:**
```
Field: "Jira Ticket ID"
API: GET https://jira.company.com/api/ticket/{value}
Response: { "valid": true, "message": "Ticket found: PROJ-123" }
```

### Telegram Bot

**Requirements:**
- Telegram bot setup by admin (bot token in system settings)
- Users link Telegram account via bot command or OAuth flow
- Store Telegram chat_id per user
- Send messages via Telegram Bot API
- Handle bot blocked by user gracefully (silent failure)

### Resource Validation (Code-Level)

**Implementation Pattern:**
- Each resource type implements validation interface
- Validation function receives resource instance data
- Returns: `{ valid: boolean, message: string }`
- Timeout handling (10 seconds max)
- Error handling for network/connection failures

**Example Resource Types to Implement:**

```typescript
// Website Resource
interface WebsiteResource {
  url: string
  ssh_host: string
  ssh_port: number
  ssh_user: string
  ssh_key: string
}

async function validateWebsite(resource: WebsiteResource): Promise<ValidationResult> {
  // Test SSH connection
  // Return { valid: true/false, message: "..." }
}

// API Endpoint Resource
interface APIEndpointResource {
  url: string
  auth_type: 'none' | 'api_key' | 'bearer'
  api_key?: string
  headers?: Record<string, string>
}

async function validateAPIEndpoint(resource: APIEndpointResource): Promise<ValidationResult> {
  // Test HTTP request
  // Return { valid: true/false, message: "..." }
}

// Database Resource
interface DatabaseResource {
  host: string
  port: number
  database_name: string
  username: string
  password: string
}

async function validateDatabase(resource: DatabaseResource): Promise<ValidationResult> {
  // Test database connection
  // Return { valid: true/false, message: "..." }
}
```

---

## Data Model (High-Level)

**Global Entities (System Admin Only):**
- Status (global, not project-scoped)
- CardType (global, not project-scoped)
- Field (belongs to card type, global)
- FieldStatusRequirement (field + status requirement, global)

**Core Entities:**
- User (from Better-Auth)
- Project
- ProjectMember (join table: user + project + role)
- Card (belongs to project + references global card type + references global status)
- CardFieldValue (card + field + value)
- Resource (belongs to project + has resource type)
- ResourceFieldValue (resource + field + value)
- Comment (belongs to card + user)
- Activity (log of changes)
- NotificationConfig (per project: which statuses trigger notifications)
- UserTelegram (user + telegram chat_id)

**Key Relationships:**
- **Global schema:** Statuses, CardTypes, Fields are system-wide (managed by System Admin)
- Project has many Cards, Members, Resources
- CardType has many Fields (with default values) - global
- Card belongs to Project, references CardType (global), Status (global), User (assignee)
- Card has many CardFieldValues, Comments, Activities
- Card references Resources via ResourceReference field values
- Resource belongs to Project, has ResourceType (enum/string), has validation_status
- Resource has many ResourceFieldValues

---

## Success Metrics

- 10+ projects created in first month
- 90%+ of transitions complete without errors
- Average global schema configuration time under 10 minutes (by system admins)
- User satisfaction: "helpful" vs "annoying" validation
- Resource validation success rate: 95%+
- System uptime: 99%+
- Board performance: <2s load time maintained

---

## References

- Existing project documentation: docs/index.md
- Architecture documentation: docs/architecture.md
- Technology stack: docs/technology-stack.md
- API contracts: docs/api-contracts.md

---

## Next Steps

1. Epic & Story Breakdown - Run: `/bmad:bmm:workflows:create-epics-and-stories`
2. Architecture Planning - Run: `/bmad:bmm:workflows:architecture`
3. Sprint Planning - Run: `/bmad:bmm:workflows:sprint-planning`

---

_This PRD defines the complete feature set for Planner's internal process management system._
