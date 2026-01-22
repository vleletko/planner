# Epic 10: Configuration Management & Portability

**Goal:** Enable configuration reuse through import/export and project duplication capabilities, accelerating new project setup and providing disaster recovery options.

**Design Token Usage:** All design values must use design tokens from the design system. See [UX Design Specification](../ux-design-specification.md) Section 6.2 - Design Tokens for token definitions.

## UX Design References

This epic implements configuration management features that should maintain consistency with the established design system and interaction patterns:

- **Design System**: shadcn/ui (New York style) + Tailwind CSS
- **Color Theme**: Balanced Teal (Primary: var(--color-primary), Success: var(--color-success), Warning: var(--color-warning), Error: var(--color-error))
- **Typography**: var(--font-sans), var(--text-base) base body text
- **Component Library**: Leverage shadcn/ui Button, Dialog, Input, Checkbox, Toast components
- **Feedback Patterns**: Toast notifications for success/error states, inline validation feedback
- **Modal Patterns**: Standard dialog sizing (Small: 400px, Medium: 600px, Large: 800px)

See [UX Design Specification](../ux-design-specification.md) sections:
- Section 1: Design System Foundation
- Section 6.2: Design Tokens
- Section 7.2: Button Hierarchy
- Section 7.3: Feedback Patterns
- Section 7.4: Form & Validation Patterns
- Section 7.5: Modal & Dialog Patterns

## Story 10.1: Export Project Configuration as JSON

As a project owner,
I want to export my project configuration as JSON,
So that I can back it up or reuse it in other projects.

**Acceptance Criteria:**

**Given** I am a project owner
**When** I navigate to project settings → Export/Import
**Then** I can export the project configuration

**And** export options include:
- "Export Configuration" button (Primary button style: var(--color-primary) background, white text)
- Checkbox: "Include sensitive credentials" (unchecked by default, use shadcn/ui Checkbox component)
- Checkbox: "Include default field values" (use shadcn/ui Checkbox component)
- Format: JSON

**And** exported configuration includes:
- Project metadata (name, description, created date)
- All statuses (name, color, order)
- All card types (name, key, color, icon)
- All fields (type, name, config, validation rules, default values)
- Card type field configurations (which fields per card type + status, requirement level, display order)
- Resource type configurations
- Notification settings

**And** when "Include sensitive credentials" is checked:
- Resource credentials are included
- Warning: "Credentials will be exported in plain text" (Warning toast: var(--color-warning-light) background, warning icon)
- Confirmation required before export (Confirmation dialog with Destructive button for proceed: var(--color-error) background)

**And** when "Include sensitive credentials" is unchecked:
- Credentials replaced with placeholder: "[CREDENTIAL_REMOVED]"
- User can manually add credentials after import

**And** export file format:
- JSON format with clear structure
- Human-readable formatting (indented)
- Version field for compatibility checking
- Timestamp of export
- Exported by user information

**And** when I click "Export Configuration":
- JSON file is generated
- File downloads to browser: `project-name-config-YYYY-MM-DD.json`
- Success message: "Configuration exported successfully" (Success toast: var(--color-success) border, green checkmark icon, var(--duration-slower) auto-dismiss)

**And** exclusions from export:
- Cards (not included in configuration)
- Comments and activity history
- Project members (not included)
- Resource instances (only resource type definitions)

**Prerequisites:** Story 9.6

**Design Implementation Notes:**

See UX Design Spec: Section 7.2 - Button Hierarchy, Section 7.3 - Feedback Patterns, Section 7.5 - Modal & Dialog Patterns

- Use shadcn/ui Dialog component (Medium size: 600px width) for export options
- Primary action button follows Button Hierarchy: var(--color-primary) primary style
- Checkboxes use shadcn/ui Checkbox component with proper labels and var(--spacing-sm) spacing
- Warning displays use inline warning pattern (var(--color-warning-light) background, var(--color-warning) text)
- Success feedback uses toast notification pattern: top-right placement, var(--duration-slower) duration
- Confirmation dialog for sensitive exports uses destructive button pattern (var(--color-error))

**Technical Notes:**
- Add ORPC query: exportProjectConfig
- Query all configuration data in single transaction
- Serialize to JSON with formatting
- Add version field for import compatibility
- Implement credential filtering logic
- Add warning for sensitive data export
- Generate filename with project name and date
- Return JSON as downloadable file
- Consider compression for large configs (.json.gz)

---

## Story 10.2: Import Project Configuration from JSON

As a project owner,
I want to import configuration from a JSON file,
So that I can quickly set up a new project with existing settings.

**Acceptance Criteria:**

**Given** I have exported configuration JSON
**When** I navigate to project settings → Export/Import
**Then** I can import configuration into the current project

**And** import UI provides:
- "Import Configuration" button (Primary button style: var(--color-primary) background)
- File upload area (drag-and-drop or browse, use shadcn/ui file upload pattern with visual feedback)
- Import options panel (Card component with var(--spacing-md) spacing)
- Preview before applying (scrollable area with clear visual hierarchy)

**And** when I select a JSON file:
- System validates JSON format
- Checks version compatibility
- Shows preview of what will be imported
- Lists conflicts with existing configuration

**And** import preview shows:
- Statuses to be created/updated (with color indicators)
- Card types to be created/updated (with type badges)
- Fields to be created/updated (grouped by type)
- Conflicts highlighted with warning color (var(--color-warning-light) background, warning icon)

**And** import options:
- "Merge with existing" (add new, keep existing)
- "Replace existing" (delete current, import new)
- Conflict resolution: "Skip", "Rename", "Overwrite"

**And** validation before import:
- JSON schema validation
- Check for missing required fields
- Validate field types
- Check for circular dependencies
- Validate status references
- Check credential placeholders

**And** when I click "Import":
- Confirmation dialog with summary (Medium dialog: 600px, clear action buttons)
- Import executes in transaction (all or nothing)
- Progress indicator for large imports (Loading state with spinner, "Importing..." text)
- Success message with summary of changes (Success toast: var(--color-success), var(--duration-slower) auto-dismiss)

**And** if import fails:
- Rollback all changes
- Error message with specific issue (Error toast: var(--color-error), 5s duration with manual close option)
- No partial import state
- Current configuration unchanged

**And** after successful import:
- Statuses, card types, fields created
- Card type field configurations applied
- Default values set
- User prompted to fill credential placeholders (if any)

**Prerequisites:** Story 10.1

**Design Implementation Notes:**

See UX Design Spec: Section 7.3 - Feedback Patterns, Section 7.4 - Form & Validation Patterns, Section 7.5 - Modal & Dialog Patterns

- Use shadcn/ui Dialog component (Large size: 800px width) for import preview
- File upload uses drag-and-drop pattern with hover state (var(--color-primary-light) background on drag-over)
- Preview panel uses shadcn/ui Card components for organized sections with var(--spacing-md) padding
- Radio buttons for import mode selection (Merge vs Replace) use shadcn/ui RadioGroup
- Conflict warnings use inline warning pattern (var(--color-warning-light) background, warning icon)
- Progress during import shows button loading state (spinner + "Importing..." text, var(--text-base) font size)
- Success/error feedback follows toast notification patterns
- Validation errors display inline with var(--color-error) text and var(--color-error-light) background

**Technical Notes:**
- Add ORPC mutation: importProjectConfig
- Validate JSON schema before processing
- Check version compatibility
- Use database transaction for atomic import
- Implement conflict detection and resolution
- Validate all references (statuses, fields)
- Handle credential placeholders
- Create UI for preview and conflict resolution
- Rollback on any error
- Log import actions for audit

---

## Story 10.3: Project Duplication

As a user,
I want to duplicate an existing project,
So that I can quickly create similar projects without manual reconfiguration.

**Acceptance Criteria:**

**Given** I have access to a project
**When** I click "Duplicate Project" in project settings
**Then** I can create a copy with the same configuration

**And** duplication dialog shows:
- New project name field (pre-filled with "Copy of [Original Name]", shadcn/ui Input component)
- New project description field (shadcn/ui Textarea component)
- Options for what to include (shadcn/ui Checkbox components with clear labels)
- "Create Duplicate" button (Primary button: var(--color-primary) background, white text)

**And** duplication options:
- ✓ Statuses (always included)
- ✓ Card types and fields (always included)
- ✓ Field requirements (always included)
- □ Resource instances (optional, unchecked by default)
- □ Notification settings (optional, checked by default)
- Note: Cards and members are never duplicated

**And** when I click "Create Duplicate":
- Button shows loading state (spinner + "Creating..." text, disabled)
- New project is created
- I become the owner
- Configuration is copied
- Default statuses applied (if not from original)
- Success message: "Project duplicated successfully" (Success toast: var(--color-success), var(--duration-slower) auto-dismiss)
- Redirected to new project with smooth transition

**And** duplicated project includes:
- All statuses with same names, colors, order
- All card types with same structure
- All fields with same configuration
- Card type field configurations
- Default field values
- Resource type definitions (if selected)
- Notification settings (if selected)

**And** duplicated project excludes:
- Cards from original project
- Comments and activity history
- Project members (only creator is member)
- Resource instances (unless explicitly included)
- Saved filter presets (user-specific)

**And** if resource instances are included:
- Resources copied with same configuration
- Credentials need to be re-entered (security)
- Validation status reset to "not validated"
- User prompted to add credentials and validate

**Prerequisites:** Story 10.2

**Design Implementation Notes:**

See UX Design Spec: Section 7.2 - Button Hierarchy, Section 7.3 - Feedback Patterns, Section 7.4 - Form & Validation Patterns, Section 7.5 - Modal & Dialog Patterns

- Use shadcn/ui Dialog component (Medium size: 600px width) for duplication options
- Input fields use shadcn/ui Input and Textarea components with proper labels and var(--spacing-sm) spacing
- Checkboxes for options use shadcn/ui Checkbox with clear descriptions and var(--spacing-xs) between items
- Pre-filled values use placeholder pattern with var(--color-text-muted) text
- Primary action button follows loading state pattern during creation
- Success feedback uses toast notification (top-right, var(--duration-slower) duration)
- Smooth page transition after success using var(--transition-fade)

**Technical Notes:**
- Add ORPC mutation: duplicateProject
- Use transaction to ensure atomic operation
- Copy all configuration data
- Generate new IDs for all entities
- Set current user as owner
- Create default project member record
- Handle resource duplication with credential reset
- Redirect to new project after creation
- Log duplication action
- Handle large projects efficiently

---

## Story 10.4: Configuration Validation and Health Check

As a project owner,
I want to validate my project configuration,
So that I can identify and fix issues before they affect users.

**Acceptance Criteria:**

**Given** I am a project owner
**When** I navigate to project settings → Configuration Health
**Then** I see a validation report of my project configuration

**And** health check validates:
- All statuses have at least one card type field configuration
- No orphaned fields (fields not used by any card type)
- Field configurations are complete for all card types
- Resource references point to valid resource types
- Conditional logic has no circular dependencies
- Default values match field type constraints
- No duplicate status/card type names

**And** validation report shows:
- Overall health score (percentage, with visual indicator: var(--color-success) for good, var(--color-warning) for warnings, var(--color-error) for errors)
- List of warnings (non-critical issues, var(--color-warning-light) background, warning icon)
- List of errors (critical issues, var(--color-error-light) background, error icon)
- Suggestions for improvement (info icon, var(--color-info-light) background)

**And** warning examples:
- "Status 'Blocked' has no card type field configurations"
- "Field 'Priority' is not used by any card type"
- "Resource type 'Website' is not used by any field"
- "No default values set for any fields"

**And** error examples:
- "Card type 'Bug' has no fields configured for status 'In Progress'"
- "Circular conditional dependency: Field A → Field B → Field A"
- "Default value for 'Priority' dropdown references non-existent option"
- "Resource reference field allows deleted resource type"

**And** for each issue:
- Severity indicator (error: var(--color-error), warning: var(--color-warning), info: var(--color-info))
- Clear description of the problem (var(--text-base) size, var(--color-text) color, var(--font-sans) font family)
- Suggested fix (var(--color-text-secondary) color with helpful guidance)
- "Fix It" button where applicable (Outline button style: var(--color-primary) border/text)

**And** automated fixes:
- Remove orphaned fields: "Delete Field"
- Fix unreachable requirements: "Make optional in intermediate status"
- Remove invalid resource type references: "Update field configuration"

**And** health check runs:
- On demand (user clicks "Run Health Check")
- After configuration import
- Before configuration export (optional)
- Shows last run timestamp

**Prerequisites:** Story 10.3

**Design Implementation Notes:**

See UX Design Spec: Section 6.2 - Design Tokens, Section 7.2 - Button Hierarchy, Section 7.3 - Feedback Patterns

- Use full-page layout or Large dialog (800px) for validation report
- Health score displayed prominently at top with circular progress indicator
- Issue lists organized in collapsible sections using shadcn/ui Accordion with var(--spacing-md) spacing
- Each issue uses shadcn/ui Card with appropriate semantic colors and var(--radius-md) border radius
- Severity badges use color-coded indicators matching semantic colors (var(--color-error), var(--color-warning), var(--color-info))
- "Fix It" actions use Outline button pattern (var(--color-primary) border/text)
- "Run Health Check" button uses Primary button style (var(--color-primary) background)
- Results display uses proper text hierarchy (var(--text-base) body, var(--text-lg) headings, var(--font-sans))

**Technical Notes:**
- Implement configuration validation logic
- Check for logical inconsistencies
- Validate all references and dependencies
- Generate validation report
- Create health check UI
- Implement automated fix actions
- Store validation results (optional)
- Add validation to import process
- Consider running periodic background health checks

---

## Story 10.5: Configuration Templates Library

As a user,
I want access to pre-built project templates,
So that I can quickly set up common workflows without starting from scratch.

**Acceptance Criteria:**

**Given** I am creating a new project
**When** I click "Create from Template" instead of "Create Project"
**Then** I see a library of available templates

**And** template library includes:
- Software Development (Bug tracking, Feature requests, Sprints)
- Marketing (Campaign planning, Content calendar)
- Support (Ticket management, Customer requests)
- Generic (Simple Kanban, To-Do List)
- Custom (user's saved templates)

**And** each template shows:
- Template name and description (clear typography hierarchy: var(--text-lg) for name, var(--text-base) for description)
- Preview of statuses and card types (with color indicators and badges)
- Number of fields included (with icon badge)
- Use case description (var(--color-text-secondary) color)
- Preview screenshot (optional, with proper image styling and var(--radius-md) border radius)

**And** when I select a template:
- Preview expands to show full configuration (smooth expansion animation using var(--transition-slide))
- "Use This Template" button (Primary button: var(--color-primary))
- Option to customize before creating (Secondary button or toggle)

**And** when I click "Use This Template":
- Dialog to enter project name and description (Medium dialog: 600px, shadcn/ui Input/Textarea)
- Option to modify template before applying (Checkbox or expandable section)
- "Create Project" button (Primary button with loading state during creation)
- Creates project with template configuration and shows success feedback

**And** built-in templates are:
- Read-only (cannot be modified, only duplicated)
- Maintained by system administrators
- Versioned (can be updated over time)

**And** custom templates:
- User can save current project as template
- "Save as Template" in project settings
- Template is private to user
- Can be edited or deleted
- Can be shared with other users (future)

**And** template management:
- List of user's custom templates
- Edit template (name, description)
- Delete template
- Duplicate template
- Export template as JSON

**Prerequisites:** Story 10.4

**Design Implementation Notes:**

See UX Design Spec: Section 6.2 - Design Tokens, Section 7.2 - Button Hierarchy, Section 7.3 - Feedback Patterns, Section 7.5 - Modal & Dialog Patterns

- Template library uses grid layout with shadcn/ui Card components for each template with var(--spacing-md) gap
- Template cards display with hover effect (var(--color-primary-light) background, var(--transition-fade))
- Selected template highlighted with var(--color-primary) border (var(--spacing-xs) width)
- Template preview uses collapsible/expandable sections (shadcn/ui Accordion or Collapsible) with var(--transition-slide)
- Category filters use shadcn/ui Tabs component with var(--spacing-lg) spacing
- Status/card type previews use appropriate color badges with var(--radius-sm) border radius
- "Use This Template" dialog follows standard Medium dialog pattern (600px) with var(--radius-md) border radius
- Creation success shows toast notification (var(--color-success), var(--duration-slower)) and redirects to new project
- Template management UI uses shadcn/ui Table or Card list with action buttons and var(--spacing-sm) spacing

**Technical Notes:**
- Create templates table (name, description, config_json, is_system, created_by)
- Add ORPC queries: listTemplates, getTemplate
- Add ORPC mutation: saveAsTemplate, deleteTemplate
- Store template configuration as JSON
- Create template library UI
- Implement template preview
- Add template selection to project creation flow
- Include built-in system templates
- Allow users to create custom templates
- Consider template sharing/marketplace (future)

---
