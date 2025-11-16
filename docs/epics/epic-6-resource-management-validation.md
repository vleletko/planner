# Epic 6: Resource Management & Validation

**Goal:** Support external resource references (Website, API Endpoint, Database) with automated validation that integrates into card transition requirements. This epic enables users to link cards to external infrastructure and ensure those resources are accessible before work proceeds.

**Design System Notice:**
All design values must use design tokens from the design system. See docs/ux-design-specification.md for token definitions.

**UX Design References:**
- User Journey: "Create Resource (Progressive Creation with Dialog Swap)" (Section 5.4)
- Component Strategy: Resource selector, Validation badges, Dialog swap pattern (Section 6.5)
- Color System: Validation states (var(--color-badge-valid), var(--color-badge-invalid), var(--color-badge-pending), var(--color-badge-not-validated))
- Design Tokens: Section 6.2 - Complete token reference for colors, typography, spacing, shadows

## Story 6.1: Resource Type Framework

As a developer,
I want a pluggable resource type system,
So that we can define different resource types with custom fields and validation logic.

**Acceptance Criteria:**

**Given** the need for different resource types
**When** I implement a new resource type in code
**Then** the system automatically supports it

**And** resource type implementation includes:
- Type identifier (e.g., "website", "api-endpoint", "database")
- Display name and icon
- Field schema definition (what fields this type has)
- Validation function (async, returns { valid: boolean, message: string })

**And** built-in resource types include:
- **Website**: url, ssh_host, ssh_port, ssh_user, ssh_key (icon: 🌐)
- **API Endpoint**: url, auth_type, api_key, headers (JSON) (icon: 🔌)
- **Database**: host, port, database_name, username, password (icon: 🗄️)

**And** resource type registry:
- Central registry of available resource types
- Type-specific field definitions
- Type-specific validation implementations
- Type-specific field rendering components

**And** validation interface is consistent:
- All validators are async functions
- Return standardized result: { valid: boolean, message: string }
- Timeout after 10 seconds
- Handle errors gracefully (return invalid with error message)

**Prerequisites:** Story 5.6

**Technical Notes:**
- Create resource type interface/abstract class
- Implement resource type registry pattern
- Create base resource types: Website, APIEndpoint, Database
- Define validation interface for all types
- Store resource type in resources table
- Store type-specific field values in JSON or separate table
- Add timeout handling to validation execution
- Log validation attempts for debugging

---

## Story 6.2: Resource Instance Creation and Management

As a project member,
I want to create and manage resource instances in my project,
So that I can reference validated external infrastructure in my cards.

**Acceptance Criteria:**

**Given** I am a project member
**When** I navigate to Resources page (dedicated page, not just settings)
**Then** I see a list of all project resources

**And** resource list page shows:
- All resources in a table or grid view
- Filter by resource type
- Search by resource name
- Sort by name, type, validation status, last validated
- "+ New Resource" button prominently displayed (primary button, var(--color-primary) background)

**And** resource list shows for each resource:
- Name and description
- Resource type (with icon: 🌐 Website, 🔌 API Endpoint, 🗄️ Database)
- Validation status badge:
  - ✓ Valid (var(--color-badge-valid) background, white text)
  - ✗ Invalid (var(--color-badge-invalid) background, white text)
  - ⏱ Pending (var(--color-badge-pending) background, white text)
  - — Not Validated (var(--color-badge-not-validated) background, white text)
- Last validation time (relative timestamp)
- Number of associated cards
- Quick actions: "View", "Edit", "Validate Now", "Delete" (outline buttons)

**And** I can create a new resource by:
- Clicking "+ New Resource" (primary button)
- Modal dialog opens (600px width, centered, var(--radius-md) border-radius)
- Dialog title: "Create Resource"
- Selecting resource type from dropdown (shows icon + type name: 🌐 Website, 🔌 API Endpoint, 🗄️ Database)
- Entering resource name (required, auto-focused)
- Entering description (optional, textarea, collapsed initially)
- Progressive field disclosure: Type-specific fields appear in collapsed section after type selected
- Clicking "Create Resource" (primary button, var(--color-primary) background)

**And** when I create a resource:
- System runs validation immediately
- Validation badge in top-right shows "Validating..." (var(--color-badge-pending), spinning icon)
- Button shows loading state: spinner icon + disabled state
- On success:
  - Badge changes to "Valid" (green checkmark, var(--color-badge-valid))
  - Success message: "Resource validated successfully"
  - Dialog closes after 1s
  - Resource appears in list with green validation badge
- On failure:
  - Badge changes to "Invalid" (red warning, var(--color-badge-invalid))
  - Error message appears below button with specific guidance (var(--color-error-light) background, var(--color-error) text)
  - "Retry Validation" button available
  - "Save Anyway" option to create with invalid status
- Validation timeout: 10 seconds

**And** when I click on a resource:
- Navigate to resource detail page
- Shows resource configuration
- Shows all associated cards (including closed/done cards)

**And** resource detail page displays:
- Resource name (large heading), type badge (icon + name), and description
- Type-specific configuration fields using inline editing pattern
- Sensitive fields masked:
  - SSH keys: show last 4 characters (****...abc1)
  - Passwords: completely masked (********)
  - API keys: show first 4 and last 4 (abcd****xyz9)
  - "Show" button to temporarily reveal (requires confirmation)
- Validation status badge with detailed message (var(--color-badge-valid)/var(--color-badge-invalid)/var(--color-badge-pending)/var(--color-badge-not-validated))
- Last validation timestamp (relative time)
- Action buttons:
  - "Edit" (outline button)
  - "Validate Now" (primary button, var(--color-primary))
  - "Delete" (destructive button, var(--color-error) background)

**And** resource detail page shows associated cards section:
- List of all cards that reference this resource
- Shows card title, type, status, assignee
- Includes cards in all statuses (open and closed)
- Click card to open card detail view
- Filter cards by status
- Shows "No cards using this resource" if none

**And** I can edit a resource by:
- Clicking "Edit" on detail page or list
- Fields use inline editing pattern:
  - Hover reveals edit affordance
  - Click field to activate editor (var(--color-primary) border when active)
  - Text fields: Save on blur or Enter, Cancel with Escape
  - Textarea: Explicit "Save" button below
  - Dropdowns: Select saves immediately
- Auto-save on field blur (500ms delay)
- Clicking "Validate Now" button re-runs full validation
- Validation badge updates with result (var(--color-badge-valid)/var(--color-badge-invalid)/var(--color-badge-pending))

**And** I can manually re-validate by:
- Clicking "Validate Now"
- System re-runs validation logic
- Status and message update
- Last validation timestamp updates

**And** I can delete a resource only if:
- No cards reference this resource
- Confirmation dialog appears
- Resource is permanently removed

**And** when I try to delete resource referenced by cards:
- Error dialog appears (var(--color-error-light) background)
- Title: "Cannot delete resource"
- Message: "Cannot delete resource referenced by X cards"
- Shows list of cards using this resource with clickable links
- Action buttons:
  - "View Associated Cards" (outline button)
  - "Close" (secondary button, var(--color-secondary))

**Prerequisites:** Story 6.1

**Technical Notes:**
- Create resources table (project_id, type, name, description, config_json, validation_status, validation_message, last_validated_at)
- Add ORPC mutations: createResource, updateResource, deleteResource, validateResource
- Add ORPC query: getResourceWithCards (includes associated cards)
- Store type-specific fields in config_json
- Run validation on create/update
- Check for card references before deletion
- Create dedicated resources page (not just in settings)
- Create resource detail page with card associations
- Implement resource type selector with icons
- Dynamic form based on selected resource type
- Query all cards that reference this resource (join on card_field_values)

**UX Implementation Notes:**
See UX Design Spec: Section 5.2 - Inline Editing Pattern

- Use shadcn/ui Dialog component for modals (600px width)
- Implement `<ResourceSelector>` custom component
- Use `<ValidationBadge>` component for status indicators
- Apply inline editing pattern from UX spec (Section 5.2)
- Use design tokens for colors (var(--color-badge-valid), var(--color-badge-invalid), var(--color-badge-pending), var(--color-badge-not-validated))
- Implement progressive field disclosure pattern
- Toast notifications using Sonner (shadcn/ui)
- Button hierarchy: Primary (var(--color-primary)), Secondary (var(--color-secondary)), Outline, Destructive (var(--color-error))
- Typography: Use var(--font-sans) for UI text, var(--font-mono) for technical values
- Spacing: var(--spacing-sm) for tight spacing, var(--spacing-md) for standard, var(--spacing-lg) for sections
- Border radius: var(--radius-md) for modals and cards

---

## Story 6.3: Resource Validation Implementation

As a system,
I want to validate resources according to their type-specific logic,
So that users know if their external infrastructure is accessible.

**Acceptance Criteria:**

**Given** a resource exists
**When** validation is triggered (create, update, manual, or during card transition)
**Then** the system executes type-specific validation

**And** for Website resource type:
- Validates SSH connection to ssh_host:ssh_port
- Attempts to authenticate with ssh_user and ssh_key
- Validation succeeds if connection and auth succeed
- Returns message: "SSH connection successful" or specific error
- Timeout after 10 seconds

**And** for API Endpoint resource type:
- Makes HTTP request to configured URL
- Includes auth_type credentials (none, api_key, bearer)
- Adds custom headers if configured
- Validation succeeds if response status is 2xx
- Returns message: "API endpoint responded with 200 OK" or error
- Timeout after 10 seconds

**And** for Database resource type:
- Attempts connection to host:port
- Authenticates with username/password
- Verifies database_name exists
- Validation succeeds if connection and database check succeed
- Returns message: "Database connection successful" or specific error
- Timeout after 10 seconds

**And** validation handles errors:
- Network errors: "Could not reach host"
- Auth errors: "Authentication failed: [reason]"
- Timeout: "Validation timeout after 10 seconds"
- Unknown errors: "Validation failed: [error message]"

**And** validation results are stored:
- validation_status: 'valid', 'invalid', 'pending', 'not_validated'
- validation_message: success or error message
- last_validated_at: timestamp

**And** validation status displayed with consistent visual design:
- Valid: var(--color-badge-valid) badge, checkmark icon (✓)
- Invalid: var(--color-badge-invalid) badge, warning icon (✗)
- Pending: var(--color-badge-pending) badge, spinner icon (⏱)
- Not Validated: var(--color-badge-not-validated) badge, dash icon (—)

**Prerequisites:** Story 6.2

**Technical Notes:**
- Implement validation for each resource type
- Use ssh2 library for SSH connections
- Use fetch/axios for API endpoint validation
- Use appropriate database client libraries (pg, mysql2, etc.)
- Implement timeout handling (10 seconds)
- Sanitize error messages (don't expose sensitive details)
- Log validation attempts with details
- Handle connection pooling for database validation
- Consider security: store credentials encrypted at rest
- Mask sensitive fields in UI (show last 4 chars of keys)

---

## Story 6.4: Resource Reference Field Type

As a project owner,
I want to add resource reference fields to card types,
So that cards can link to validated external infrastructure.

**Acceptance Criteria:**

**Given** I am configuring fields for a card type
**When** I add a "Resource Reference" field
**Then** I can configure which resource type(s) can be selected

**And** field configuration includes:
- Field name (e.g., "Deployment Target", "API Integration")
- Allowed resource types (select one or more: Website, API Endpoint, Database)
- Allow multiple resources or single resource only
- Required/optional per status (like other fields)

**And** when users interact with resource reference fields:
- Dropdown shows all project resources of allowed types (shadcn/ui Select component)
- Resources grouped by type with section headers
- Each resource option displays:
  - Type icon (🌐/🔌/🗄️) on left
  - Resource name (var(--font-semibold))
  - Validation status badge on right (✓/✗/⏱/—)
- Can select invalid resource (shows warning badge but allows selection)
- Search/filter resources by name (dropdown with search input)
- "+ Create New Resource" button at bottom of dropdown (var(--color-primary) text, icon)

**And** when user clicks "Create New Resource":
- Dialog swap animation triggers (var(--duration-slow) transition)
- Breadcrumb bar slides down from top: "Card [CARD-ID] > Create Resource"
- Card dialog content slides left and fades out
- Resource creation dialog slides in from right and fades in
- Same dialog container, maintains dimensions (600-800px width)
- Resource form shows:
  - Type selector (if multiple types allowed)
  - Name field (auto-focused)
  - Description (optional, collapsed)
  - Type-specific fields (progressive disclosure)
- User fills fields and clicks "Create Resource" (primary button, var(--color-primary))
- Validation runs with badge feedback in top-right
- On success:
  - Dialog content slides back (reverses animation)
  - New resource auto-selected in card's resource field
  - Card form remains open
  - User can continue editing card
- Breadcrumb click returns to card (with confirmation if unsaved changes)

**And** resource display in forms shows:
- Resource name (var(--font-semibold)) and type icon
- Validation status badge with icon (✓/✗/⏱/—) and color (var(--color-badge-valid)/var(--color-badge-invalid)/var(--color-badge-pending)/var(--color-badge-not-validated))
- Last validation time (relative, e.g., "2 minutes ago")
- "Re-validate" button (outline button, small) to trigger on-demand validation

**And** in card detail view (inline editing pattern):
- Resource field label (var(--font-semibold), var(--text-base))
- Resource name is clickable link (var(--color-primary), underline on hover) to resource detail page
- Validation status badge inline with name
- Validation message below (if invalid: var(--color-error) text, warning icon)
- Last validated timestamp below (var(--color-text-secondary) text, var(--text-sm))
- "Re-validate" button inline (outline button, small)
- Hover over field shows edit icon to change resource
- Click to open resource selector dropdown

**Prerequisites:** Story 6.3

**Technical Notes:**
- Add "resource_reference" to field type registry
- Store resource reference in card_field_values as resource_id
- Create resource picker component
- Query resources filtered by allowed types
- Show validation status with icons/colors
- Support single and multiple resource selection
- Join resource data when loading card details
- Add resource validation check during field validation

**UX Implementation Notes:**
See UX Design Spec: Section 5.4 - Progressive Creation with Dialog Swap

- Implement `<DialogSwap>` component with breadcrumb navigation (Section 5.4)
- Use var(--duration-slow) slide animation (slides + fade, synchronized)
- Breadcrumb: var(--color-background-tertiary) background, var(--color-primary) text for clickable parts, left arrow icon
- Resource selector uses shadcn/ui Select with custom option rendering
- Implement `<ResourceSelector>` with validation badge integration
- Dialog swap maintains same container (600-800px width depending on context)
- Apply inline editing pattern for resource field in card detail
- Use relative timestamps ("2 minutes ago") for last validation time
- Typography: var(--font-semibold) for labels, var(--text-base) for primary content, var(--text-sm) for secondary info
- Spacing: var(--spacing-md) between form sections, var(--spacing-sm) between related elements

---

## Story 6.5: Resource Validation in Card Transitions

As a user,
I want card transitions to validate referenced resources,
So that I can't advance work when infrastructure is inaccessible.

**Acceptance Criteria:**

**Given** a card has a resource reference field
**When** I attempt to transition the card to a new status
**Then** the system validates all referenced resources

**And** during status transition validation:
- Check if resource reference field is required for target status
- If required and resource is referenced, check resource validation status
- Re-validate resource if last validation was more than 5 minutes ago
- Show validation progress in transition dialog

**And** if resource field is required and resource is invalid:
- Block transition (transition button disabled, var(--color-text-muted))
- Error message appears in transition dialog (var(--color-error-light) background strip):
  - Icon: Warning icon (⚠, var(--color-error))
  - Message: "Resource [name] validation failed: [specific validation message]"
  - Guidance text below in var(--text-sm)
- "Re-validate Resource" button appears (outline button, var(--color-warning) accent)
- User clicks to re-run resource validation
- Button shows loading state during validation (spinner icon)
- On success: Error clears, transition button enables (var(--color-primary))
- On failure: New error message shows, button remains disabled
- Transition proceeds only when resource becomes valid

**And** if resource field is required but no resource selected:
- Block transition
- Show error: "Please select a [field name]"
- User must select a resource to proceed

**And** if resource field is optional:
- Resource validation status doesn't block transition
- Warning badge shown if resource is invalid (var(--color-warning-light) background):
  - Icon: Info icon (ℹ, var(--color-warning))
  - Message: "Resource [name] is invalid but transition allowed"
- Transition button remains enabled (var(--color-primary))

**And** in transition dialog, resource fields show:
- Resource name (var(--font-semibold)) and type icon (🌐/🔌/🗄️)
- Current validation status badge with icon (✓/✗/⏱/—)
- Validation message (below name, var(--text-sm)):
  - Valid: var(--color-success) text with checkmark
  - Invalid: var(--color-error) text with warning icon, error message
  - Pending: var(--color-warning) text with spinner
- "Re-validate" button (outline button, small, inline)
- Last validated timestamp (var(--color-text-secondary) text, relative time)
- Clear visual blocking indicator if transition blocked:
  - var(--color-error-light) background strip on entire field section
  - var(--color-error) border on left (var(--spacing-xs) thick)
  - var(--font-semibold) error text explaining block

**And** when user clicks "Re-validate":
- Button shows loading state: spinner icon replaces text, button disabled
- Badge changes to "Validating..." (var(--color-badge-pending), spinning icon)
- Triggers backend resource validation (timeout: 10s)
- Real-time updates:
  - Badge animates during validation
  - Progress indicator if validation takes >2s
- On success:
  - Badge changes to "Valid" (var(--color-badge-valid), checkmark)
  - Error background clears (var(--color-error-light) → var(--color-background))
  - Transition button enables (var(--color-text-muted) → var(--color-primary))
  - Success message appears briefly (var(--duration-slower) fade)
- On failure:
  - Badge changes to "Invalid" (var(--color-badge-invalid), warning)
  - New error message appears with specific details
  - Transition button remains disabled
  - "Re-validate" button re-enables for retry

**Prerequisites:** Story 6.4

**Technical Notes:**
- Check resource validation status during card transition
- Re-validate stale resources (>5 min old)
- Add resource validation to transition validation logic
- Create resource validation UI in transition dialog
- Add ORPC endpoint to trigger resource re-validation
- Update validation status in real-time
- Log resource validation failures in activity history
- Consider caching to avoid re-validating same resource multiple times in short period

**UX Implementation Notes:**
See UX Design Spec: Section 5.2 - Card Transition with Validation

- Integrate with transition dialog from "Card Transition with Validation" journey (Section 5.2)
- Use optimistic UI pattern: Show validation progress inline
- Apply validation badge component consistently
- Error states use var(--color-error-light) background strips with var(--spacing-xs) left border (var(--color-error))
- Success transitions smooth: var(--color-error-light) → var(--color-background) background (var(--duration-normal) fade)
- Button states follow hierarchy: Disabled (var(--color-text-muted)), Enabled (var(--color-primary))
- Real-time validation updates using WebSocket or polling
- Progress indicator appears after 2s delay (prevents flash for fast validations)
- Toast notification (Sonner) for validation completion if dialog closed
- Typography: var(--font-semibold) for error text, var(--text-sm) for guidance
- Spacing: var(--spacing-md) between field sections, var(--spacing-sm) for inline elements

---

## Story 6.6: Resource Credentials Security

As a system administrator,
I want resource credentials stored securely,
So that sensitive access credentials are protected.

**Acceptance Criteria:**

**Given** resources contain sensitive credentials
**When** credentials are stored or displayed
**Then** security measures are applied

**And** credential storage:
- Passwords, SSH keys, API keys encrypted at rest
- Use encryption key from environment variables
- Encryption happens before database insert
- Decryption only when needed for validation

**And** credential display in UI:
- SSH keys: show last 4 characters, mask rest (****...abc1)
- Passwords: completely masked (********)
- API keys: show first 4 and last 4, mask middle (abcd****xyz9)
- Masked display uses monospace font (var(--font-mono))
- "Show" button to temporarily reveal:
  - Outline button with eye icon
  - Click triggers confirmation dialog
  - Dialog title: "Reveal Credential"
  - Message: "This will temporarily display the credential in plain text"
  - Buttons: "Show" (primary, var(--color-primary)), "Cancel" (secondary, var(--color-secondary))
  - On confirm: Field shows plain text for 10 seconds, then auto-masks
  - Eye icon changes to eye-slash while revealed

**And** credential access control:
- Only project members can view resource details
- Credentials transmitted over HTTPS only
- Credentials never logged in plain text
- Credentials excluded from API responses by default

**And** when exporting project configuration:
- Export dialog shows checkbox: "Include sensitive credentials" (unchecked by default)
- Warning message (var(--color-warning-light) background, var(--color-warning) border):
  - Icon: Warning icon
  - Text: "Credentials will be exported in plain text. Handle with care."
- Export with placeholder if excluded: "[CREDENTIAL_REMOVED]"
- Confirmation dialog if credentials included:
  - Title: "Export with Credentials"
  - Message: "You are about to export sensitive credentials in plain text. Ensure secure handling."
  - Buttons: "Export Anyway" (destructive, var(--color-error)), "Cancel" (secondary, var(--color-secondary))

**And** audit logging:
- Log who creates/edits resources
- Log validation attempts (not credential values)
- Log credential reveal actions
- Available to project owners and admins

**Prerequisites:** Story 6.5

**Technical Notes:**
- Use encryption library (e.g., crypto module with AES-256)
- Store encryption key in environment variable (not in code)
- Encrypt before database insert, decrypt before validation
- Add encrypted flag to indicate which fields are encrypted
- Create credential input component with masking
- Add "reveal" toggle with security confirmation
- Exclude encrypted fields from default API responses
- Add audit log table for sensitive operations
- Consider using secrets management service (AWS Secrets Manager, HashiCorp Vault)

**UX Implementation Notes:**
See UX Design Spec: Section 6.2 - Design Tokens for Typography and Colors

- Create `<CredentialField>` component with built-in masking
- Use monospace font (var(--font-mono)) for masked values
- Implement eye/eye-slash toggle with Lucide icons
- Auto-mask after 10 seconds when revealed (setTimeout)
- Confirmation dialogs use shadcn/ui AlertDialog component
- Warning messages: var(--color-warning-light) background, var(--color-warning) left border (var(--spacing-xs))
- Destructive actions (export with credentials): var(--color-error) button
- Apply security badge/indicator where credentials are visible
- Audit log visible in resource detail page (Activity tab pattern)
- Typography: var(--font-mono) for credentials, var(--text-sm) for helper text
- Spacing: var(--spacing-md) between credential fields, var(--spacing-sm) for inline buttons
- Border radius: var(--radius-sm) for input fields

---
