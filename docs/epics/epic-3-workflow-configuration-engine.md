# Epic 3: Workflow Configuration Engine

**Goal:** Allow project owners to define custom statuses, card types, and field structures that define their workflow. This epic provides the core configuration capabilities that make the system adaptable to any process.

**UX Design Reference:** This epic implements configuration interfaces following the design system and UX patterns defined in `/docs/ux-design-specification.md`. All configuration screens use the inline editing pattern, design tokens, and accessibility standards outlined in the UX specification.

**Design Token Usage:** All design values must use design tokens from the design system. See docs/ux-design-specification.md for token definitions.

## Story 3.1: Status Management

As a project owner,
I want to create and manage workflow statuses,
So that I can define the stages work items move through.

**UX Design:** See UX Design Spec: Section 5.1 - Core UX Pattern: Inline Editing

**Acceptance Criteria:**

**Given** I am a project owner or admin
**When** I navigate to project settings → Workflow tab
**Then** I see the current list of statuses in order with default statuses (Backlog, In Progress, Done)

**And** I can create a new status by:
- Clicking "Add Status" button (primary button style: var(--color-primary) background, white text)
- Entering status name (required, min 3 characters)
- Selecting status color from palette (must meet WCAG AA contrast: 4.5:1 for text)
- Status appears at end of list with smooth fade-in animation (var(--duration-normal))

**And** I can reorder statuses by:
- Dragging status to new position (using @dnd-kit with keyboard support)
- Visual feedback: card tilts 3-5° during drag, elevated shadow (var(--shadow-xl))
- Order saves automatically with optimistic UI
- Board columns update to match new order

**And** I can edit a status by:
- Clicking status to edit (inline editing pattern - UX Spec Section 5.1)
- Field transforms to input with var(--color-primary) border on focus
- Changing name and color
- Save on blur or Enter key, Cancel with Escape
- Changes save and reflect immediately on board with optimistic UI

**And** I can delete a status only if:
- No cards currently have that status
- Confirmation dialog appears (shadcn/ui Dialog component)
- Dialog has destructive button (var(--color-error) background, white text)
- Status is removed from list with fade-out animation (var(--duration-normal))

**And** when I try to delete status with cards:
- Error toast notification (top-right, var(--color-error-light) background, var(--color-error) left border)
- Error message: "Cannot delete status with X cards. Move cards first."
- Toast auto-dismisses after 5s or manual close

**Prerequisites:** Story 2.5

**Technical Notes:**
- Create `statuses` table (project_id, name, color, order, created_at)
- Add ORPC mutations: createStatus, updateStatus, deleteStatus, reorderStatuses
- Implement drag-and-drop reordering with @dnd-kit library (keyboard accessible)
- Validate status deletion (check for cards in that status)
- Use shadcn/ui color picker component with WCAG AA contrast validation
- Order field determines column position on board

**Design System References:**
- Button hierarchy: UX Spec Section 7.2 (Primary, Secondary, Destructive buttons)
- Inline editing pattern: UX Spec Section 5.1
- Drag-and-drop animations: UX Spec Section 7.10 (anime.js, 3-5° tilt, var(--shadow-xl))
- Toast notifications: UX Spec Section 7.3 (Feedback patterns)
- Color tokens: Use CSS variables from UX Spec Section 6.2 (var(--color-primary), var(--color-error), etc.)
- Spacing: var(--spacing-xs), var(--spacing-sm), var(--spacing-md), etc.
- Border radius: var(--radius-md) for cards and dialogs
- Accessibility: WCAG 2.1 AA compliance, keyboard navigation, screen reader support

---

## Story 3.2: Card Type Management

As a project owner,
I want to define card types for different kinds of work items,
So that I can categorize and structure cards appropriately.

**UX Design:** See UX Design Spec: Section 5.1 - Core UX Pattern: Inline Editing; Section 7.13 - Card Type Badges

**Acceptance Criteria:**

**Given** I am a project owner or admin
**When** I navigate to project settings → Card Types tab
**Then** I see a list of card types (initially empty)

**And** I can create a card type by:
- Clicking "Add Card Type" button (primary button: var(--color-primary), white text)
- Entering name (e.g., "Bug", "Feature", "Task") with inline editing pattern
- Entering key (e.g., "BUG", max 5 chars, unique, var(--font-mono))
- Selecting color from palette (WCAG AA compliant colors)
- Selecting icon from Lucide icon library (var(--text-lg) size)
- Card type appears in list with fade-in animation (var(--duration-normal))

**And** when I create a card type:
- Key is auto-suggested from name (e.g., "Bug Report" → "BUG")
- Key must be unique within project
- Key is uppercase, alphanumeric only

**And** I can edit card type by:
- Clicking card type to edit (inline editing pattern)
- Field transforms with var(--color-primary) border on focus
- Modifying name, color, or icon
- Key cannot be changed after creation (displayed in var(--color-text-muted), non-editable)
- Auto-save on blur or Enter key
- Changes save and update all cards of that type with optimistic UI

**And** I can delete card type only if:
- No cards of that type exist
- Confirmation dialog appears (shadcn/ui Dialog)
- Dialog shows destructive action button (var(--color-error))
- Card type is removed with fade-out animation

**And** when I try to delete card type with existing cards:
- Error toast notification (var(--color-error-light) background, var(--color-error) border)
- Error message: "Cannot delete card type with X cards. Delete or convert cards first."
- Toast includes warning icon and auto-dismisses after 5s

**Prerequisites:** Story 3.1

**Technical Notes:**
- Create `card_types` table (project_id, name, key, color, icon, created_at)
- Add ORPC mutations: createCardType, updateCardType, deleteCardType
- Validate unique key constraint per project
- Use Lucide React icon picker component (icons sized var(--text-lg))
- Key auto-generation logic: uppercase, remove spaces, truncate to 5 chars
- Validate card type deletion (check for cards with that type)

**Design System References:**
- Card type badges: UX Spec Section 7.13 (Icon + key + color, var(--font-mono))
- Badge sizing: Medium variant (icon var(--text-lg), text var(--text-sm)) for lists
- Inline editing: UX Spec Section 5.1 (click to edit, save on blur/Enter)
- Icon library: Lucide React (integrated with shadcn/ui)
- Color palette: WCAG AA compliant colors with 4.5:1 contrast
- Typography: var(--font-mono) for card type keys
- Animation: var(--duration-normal) fade transitions
- Feedback: Toast notifications per UX Spec Section 7.3

---

## Story 3.3: Field Definition and Basic Types

As a project owner,
I want to define custom fields for my card types,
So that I can capture the specific information needed for each work item.

**UX Design:** See UX Design Spec: Section 5.1 - Core UX Pattern: Inline Editing; Section 6.5 - Field Editors; Section 7.10 - Drag-and-Drop

**Acceptance Criteria:**

**Given** I have created a card type
**When** I navigate to Card Types → [Card Type] → Fields
**Then** I see a list of fields for that card type (initially empty except "Title" which is always present)

**And** I can add a field by:
- Clicking "Add Field" button (primary button: var(--color-primary))
- Selecting field type from dropdown (Text, Number, Date, Dropdown, Multi-Select)
- Entering field name with inline editing
- Configuring type-specific options in expanded panel
- Field appears in list with smooth fade-in animation (var(--duration-normal))

**And** for Text field, I can configure:
- Single line or multi-line
- Min/max length validation
- Placeholder text
- Default value

**And** for Number field, I can configure:
- Integer or decimal
- Min/max value
- Step increment
- Default value

**And** for Date field, I can configure:
- Date picker format
- Min/max date constraints
- Default to today option
- Default value

**And** for Dropdown field, I can configure:
- List of options (add/remove/reorder)
- Display name and value for each option
- Optional color per option
- Default selected value

**And** for Multi-Select field, I can configure:
- List of options (add/remove/reorder)
- Min/max selection count
- Default selected values

**And** I can reorder fields by dragging:
- Using @dnd-kit with keyboard support (Ctrl+Shift+Arrow)
- Visual feedback: tilt animation, elevated shadow
- Insertion indicator: horizontal var(--color-primary) line (2px) showing drop position
- Auto-save with optimistic UI

**And** I can delete fields:
- Click delete icon (trash icon, var(--spacing-xl) hit target)
- Confirmation dialog (destructive button: var(--color-error))
- Field removed with fade-out animation

**And** field changes apply to all cards of that type:
- Changes propagate immediately with optimistic UI
- Toast notification confirms update

**Prerequisites:** Story 3.2

**Technical Notes:**
- Create `fields` table (card_type_id, name, type, config_json, order, created_at)
- Store field-specific config in JSON column (validation rules, options, defaults)
- Add ORPC mutations: createField, updateField, deleteField, reorderFields
- Create field configuration UI with type-specific forms
- "Title" field is system-generated and cannot be deleted
- Implement field type registry pattern for extensibility

**Design System References:**
- Form components: shadcn/ui Input, Textarea, Select, Checkbox per type
- Field editors: UX Spec Section 6.5 (Field-specific variants)
- Inline editing pattern: UX Spec Section 5.1
- Drag-and-drop: UX Spec Section 7.10 (@dnd-kit with keyboard navigation)
- Insertion indicator: var(--color-primary) line, 2px height
- Icon buttons: Minimum var(--spacing-xl) hit target (trash, edit icons from Lucide)
- Spacing: Field list uses var(--spacing-md) vertical spacing
- Progressive disclosure: Collapsed/expanded panels for field configuration
- Validation feedback: Inline errors with var(--color-error) text, var(--color-error-light) background

---

## Story 3.4: Field Requirement Configuration per Status

As a project owner,
I want to configure which fields are required for each status,
So that I can enforce data quality at appropriate workflow stages.

**UX Design:** See UX Design Spec: Section 7.13 - Badges (Requirement Badges)

**Acceptance Criteria:**

**Given** I have defined fields for a card type
**When** I navigate to Card Types → [Card Type] → Field Requirements
**Then** I see a matrix: fields (rows) × statuses (columns)

**And** for each field-status combination, I can set:
- Required (field must be filled to enter this status)
- Optional (field is visible but not required)
- Hidden (field is not shown in this status)

**And** the configuration UI provides:
- Dropdown or radio buttons for each cell (shadcn/ui Select component)
- Visual indicators for requirement level:
  - Required: Red asterisk (*) + "Required" badge (var(--color-error))
  - Optional: Gray dash (-) + "Optional" badge (var(--color-text-muted))
  - Hidden: Eye-slash icon + "Hidden" badge (var(--color-border))
- Bulk actions: "Set all to Required/Optional/Hidden" button per field row
- Preview panel showing field visibility per status with real-time updates

**And** "Title" field is always Required for all statuses (cannot be changed)

**And** when I save requirement configuration:
- Changes take effect immediately
- Existing cards are not automatically updated
- New status transitions enforce new requirements

**And** I can see summary view:
- "Backlog requires: Title, Description"
- "In Progress requires: Title, Description, Assignee"
- "Done requires: Title, Description, Assignee, Resolution"

**Prerequisites:** Story 3.3

**Technical Notes:**
- Create `field_requirements` table (field_id, status_id, requirement_level)
- requirement_level enum: 'required', 'optional', 'hidden'
- Add ORPC mutations: setFieldRequirement, bulkSetRequirements
- Build matrix UI component for configuration
- Query optimization: load all requirements for card type at once
- Cache requirement matrix in frontend for performance

**Design System References:**
- Matrix table: shadcn/ui Table component with fixed header
- Cell selectors: shadcn/ui Select for dropdown per cell
- Badges: UX Spec Section 7.13 (color-coded requirement badges)
- Visual indicators: Lucide icons (asterisk for required, eye-slash for hidden)
- Bulk action buttons: Secondary button style (var(--color-secondary))
- Preview panel: Card component showing field visibility simulation
- Color coding:
  - Required fields: var(--color-error) background for badge
  - Optional fields: var(--color-text-muted) background
  - Hidden fields: var(--color-border) background with reduced opacity
- Spacing: Matrix cells use var(--spacing-sm) padding
- Hover states: Cell background → var(--color-hover) on hover
- Summary view: List format with status names and required field names

---

## Story 3.5: Visual Schema Editor and Preview

As a project owner,
I want a visual interface to configure my workflow schema,
So that I can easily understand and modify my setup.

**UX Design:** See UX Design Spec: Section 7.13 - Card Type Badges; Section 7.10 - Drag-and-Drop

**Acceptance Criteria:**

**Given** I am configuring a card type
**When** I navigate to Card Types → [Card Type] → Schema Editor
**Then** I see a visual representation of the card structure

**And** the schema editor displays:
- Card type header with badge (name, key, icon, color - var(--font-mono) for key)
- List of fields with type indicators (icons from Lucide)
- Field requirement matrix (fields × statuses) with color-coded badges
- Drag handles for reordering (6-dot icon, visible on hover)
- Edit/delete icon buttons for each element (pencil/trash, var(--spacing-xl) hit targets)

**And** I can preview how cards look by:
- Clicking "Preview" button (outline button: var(--color-primary) border/text)
- Selecting a status from dropdown (shadcn/ui Select)
- Seeing simulated card form in modal (800px width) with:
  - All required fields marked with asterisk (*) in var(--color-error)
  - Optional fields visible without indicator
  - Hidden fields not shown
  - Validation rules applied
  - Default values pre-filled
  - Card uses actual field components (Input, Textarea, etc.)

**And** the preview updates in real-time as I:
- Change field requirements
- Reorder fields
- Modify validation rules
- Set default values

**And** I can switch between statuses in preview to:
- See how required fields change per status
- Verify workflow progression makes sense
- Identify potential issues (e.g., field required too early)

**And** validation warnings appear if:
- No fields are required for a status
  - Warning badge (var(--color-warning)) with message
- Same field is hidden then required in next status
  - Warning inline message explaining conflict
- Conflicting validation rules exist
  - Error inline message (var(--color-error) text, var(--color-error-light) background)
- Warnings use shadcn/ui Alert component with icon

**Prerequisites:** Story 3.4

**Technical Notes:**
- Build visual schema editor component
- Implement real-time preview with live updates
- Use card form component in preview mode
- Add validation rule checker for schema conflicts
- Provide helpful tooltips and guidance
- Save schema state to prevent data loss on navigation
- Consider using form builder library for preview rendering

**Design System References:**
- Schema editor layout: Two-column grid (editor left, preview right)
- Card type header badge: UX Spec Section 7.13 (icon + key + color, var(--font-mono))
- Field list: Vertical layout with var(--spacing-md) between items
- Drag handles: Lucide grip-vertical icon, var(--color-text-muted) color, visible on hover
- Field type indicators: Icon per field type (text, number, date, etc.)
- Preview modal: shadcn/ui Dialog, 800px width, scrollable body
- Preview status selector: Dropdown at top of preview panel
- Real-time updates: Debounced (var(--duration-slow)) to prevent excessive re-renders
- Validation warnings: shadcn/ui Alert component
  - Warning level: var(--color-warning) background, var(--color-text) text, warning icon
  - Error level: var(--color-error) background, white text, error icon
- Required field indicators: var(--color-error) asterisk (*) + "Required" label
- Tooltips: shadcn/ui Tooltip for helpful hints
- Color system: Use design tokens (var(--color-primary), var(--color-warning), var(--color-error))
- Typography: Field names use var(--text-base), keys use var(--font-mono)
- Spacing: Schema editor uses var(--spacing-lg) for section spacing
- Animation: Smooth transitions (var(--duration-normal)) when switching preview status

---
