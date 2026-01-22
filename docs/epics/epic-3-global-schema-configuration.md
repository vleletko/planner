# Epic 3: Global Schema Configuration

**Goal:** Allow system administrators to define global statuses, card types, and field structures through a visual schema editor. All projects share the same workflow schema, ensuring consistency across the organization.

**UX Design Reference:** This epic implements configuration interfaces following the design system and UX patterns defined in `/docs/ux-design-specification.md`. All configuration screens use the inline editing pattern, design tokens, and accessibility standards outlined in the UX specification.

**Design Token Usage:** All design values must use design tokens from the design system. See docs/ux-design-specification.md for token definitions.

**Access Control:** All schema configuration features (statuses, card types, fields) are restricted to **System Administrators only**. Regular users can read/view the schema but cannot modify it.

## Story 3.1: Status Management

As a system administrator,
I want to create and manage global workflow statuses,
So that I can define the stages work items move through across all projects.

**UX Design:** See UX Design Spec: Section 5.1 - Core UX Pattern: Inline Editing

**Acceptance Criteria:**

**Given** I am a system administrator
**When** I navigate to Admin → Schema → Statuses
**Then** I see the current list of global statuses in order with default statuses (Backlog, In Progress, Done)

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
- Create `statuses` table (NO project_id - global entity: name, color, order, is_active, created_at, updated_at, created_by)
- Add ORPC mutations: createStatus, updateStatus, deleteStatus, reorderStatuses (SYSTEM ADMIN ONLY)
- Add ORPC queries: listStatuses (admin), listActiveStatuses (public read)
- Implement system admin authorization check on all mutations
- Implement drag-and-drop reordering with @dnd-kit library (keyboard accessible)
- Validate status deletion (check for cards in that status across ALL projects)
- Use shadcn/ui color picker component with WCAG AA contrast validation
- Order field determines column position on board
- is_active field allows soft-disabling statuses without deletion

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

As a system administrator,
I want to define global card types for different kinds of work items,
So that all projects can categorize and structure cards consistently.

**UX Design:** See UX Design Spec: Section 5.1 - Core UX Pattern: Inline Editing; Section 7.13 - Card Type Badges

**Acceptance Criteria:**

**Given** I am a system administrator
**When** I navigate to Admin → Schema → Card Types
**Then** I see a list of global card types (initially empty)

**And** I can create a card type by:
- Clicking "Add Card Type" button (primary button: var(--color-primary), white text)
- Entering name (e.g., "Bug", "Feature", "Task") with inline editing pattern
- Entering key (e.g., "BUG", max 5 chars, unique, var(--font-mono))
- Selecting color from palette (WCAG AA compliant colors)
- Selecting icon from Lucide icon library (var(--text-lg) size)
- Card type appears in list with fade-in animation (var(--duration-normal))

**And** when I create a card type:
- Key is auto-suggested from name (e.g., "Bug Report" → "BUG")
- Key must be GLOBALLY unique (across entire system)
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
- Create `card_types` table (NO project_id - global entity: name, key, color, icon, is_active, created_at, updated_at, created_by)
- Add ORPC mutations: createCardType, updateCardType, deleteCardType (SYSTEM ADMIN ONLY)
- Add ORPC queries: listCardTypes (admin), listActiveCardTypes (public read)
- Implement system admin authorization check on all mutations
- Validate GLOBAL unique key constraint (key must be unique across entire system)
- Use Lucide React icon picker component (icons sized var(--text-lg))
- Key auto-generation logic: uppercase, remove spaces, truncate to 5 chars
- Validate card type deletion (check for cards with that type across ALL projects)
- is_active field allows soft-disabling card types without deletion

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

As a system administrator,
I want to define reusable global fields,
So that I can create a library of fields that can be added to any card type.

**UX Design:** See Epic 3 UX Design Specification (`_bmad-output/planning-artifacts/epic-3-ux-design-specification.md`)

**Acceptance Criteria:**

**Given** I am a system administrator
**When** I navigate to Admin → Schema → Fields
**Then** I see a list of global fields (the field library)

**And** I can add a field by:
- Clicking "Add Field" button (primary button: var(--color-primary))
- Selecting field type from type selector (Text, Number, Date, Dropdown, Multi-Select)
- Entering field name (required)
- Configuring type-specific options in dialog
- Clicking "Create Field" to save
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
- List of options (add/remove/reorder) - minimum 1 option required
- Display name and value for each option (values must be unique)
- Optional color per option
- Default selected value

**And** for Multi-Select field, I can configure:
- List of options (add/remove/reorder) - minimum 1 option required
- Min/max selection count
- Default selected values

**And** I can edit a field by:
- Clicking on field row to open slide-over panel
- Editing field name and type-specific options
- Changes save automatically (debounced)
- Closing panel when done

**And** I can delete a field only if:
- Field is not used by any card type
- If used: Toast appears: "Cannot delete '[Field Name]' - used by [Card Type Names]"
- If unused: Confirmation dialog appears
- Field removed with fade-out animation

**And** each field row shows:
- Field type icon
- Field name
- Field type label
- Usage count: "Used by X card types"

**Prerequisites:** Story 3.2

**Technical Notes:**
- Create `fields` table (NO card_type_id - global entity: id, name, type, config_json, created_at, updated_at, created_by)
- Store field-specific config in JSON column (validation rules, options, defaults)
- Add ORPC mutations: createField, updateField, deleteField (SYSTEM ADMIN ONLY)
- Add ORPC queries: listFields (public read)
- Implement system admin authorization check on all mutations
- Create field configuration UI with type-specific forms
- "Title" field is system-generated, always exists, cannot be deleted or edited
- Implement field type registry pattern for extensibility
- Validate field deletion (check usage in card_type_field_configs table)

**Design System References:**
- Form components: shadcn/ui Input, Textarea, Select, Checkbox per type
- Field editors: UX Spec Section 6.5 (Field-specific variants)
- Slide-over panel: shadcn/ui Sheet component
- Icon buttons: Minimum var(--spacing-xl) hit target (trash, edit icons from Lucide)
- Spacing: Field list uses var(--spacing-md) vertical spacing
- Progressive disclosure: Collapsed/expanded panels for field configuration
- Validation feedback: Inline errors with var(--color-error) text, var(--color-error-light) background

---

## Story 3.4: Card Type Field Configuration per Status

As a system administrator,
I want to configure which fields appear on each card type for each status,
So that I can control what information is visible and required at each workflow stage.

**UX Design:** See Epic 3 UX Design Specification (`_bmad-output/planning-artifacts/epic-3-ux-design-specification.md`) - Card Type Detail screen

**Acceptance Criteria:**

**Given** I am a system administrator
**When** I navigate to Admin → Schema → Card Types → [Card Type]
**Then** I see the Card Type Detail screen with:
- Card type properties on the left (name, key, color, icon)
- Field configuration on the right with status selector
- Card preview at the bottom showing the result

**And** I can select a status using:
- Horizontal status pill/tab bar showing all active statuses
- Active status has filled background with status color
- Clicking any status switches the field configuration context

**And** for the selected status, I can:
- See the list of fields configured for this card type + status
- Each field shows: drag handle, type icon, field name, requirement dropdown
- "Title" field is always present with lock icon, marked "Always Required"

**And** I can add a field to the current status by:
- Clicking "Add Field" button below field list
- Selecting from available fields in the global field library
- Field appears as "Optional" by default
- Card preview updates immediately

**And** for each field, I can set requirement level:
- Dropdown with options: "Required" or "Optional"
- Required: field must be filled to transition INTO this status
- Optional: field is visible but not required
- When changing to "Required" and cards exist in this status without the field:
  - Dialog shows impact: "X cards in '[Status]' don't have this field"
  - Explains grandfathering: "Existing cards will be exempt. Only new transitions require this field."
  - Admin confirms or cancels

**And** I can reorder fields for the current status by:
- Dragging field rows via drag handle
- Visual feedback: tilt animation, elevated shadow
- Order determines display order on cards in this status
- Order is per-status (different statuses can have different field orders)

**And** I can remove a field from the current status by:
- Clicking remove (X) icon on field row
- Field is removed from this status only (not deleted globally)
- No confirmation needed (action is easily reversible by re-adding)

**And** I can clone field configuration to another status by:
- Clicking "Clone to status..." button
- Selecting target status from dropdown
- Confirmation: "Copy field configuration from '[Source]' to '[Target]'? Existing configuration in '[Target]' will be replaced."
- Clone copies: fields, their order, and required/optional settings

**And** "Title" field is always present and required for all statuses (system-enforced, cannot be removed or changed)

**And** changes save automatically with:
- Visual feedback: "Saving..." then "Saved" indicator
- Optimistic UI updates
- Card preview reflects changes immediately

**Prerequisites:** Story 3.3

**Technical Notes:**
- Create `card_type_field_configs` table (card_type_id, status_id, field_id, requirement_level, display_order)
- requirement_level enum: 'required', 'optional' (NO 'hidden' state)
- Add ORPC mutations: addFieldToCardTypeStatus, removeFieldFromCardTypeStatus, setFieldRequirement, reorderFieldsForStatus, cloneFieldConfiguration (SYSTEM ADMIN ONLY)
- Add ORPC queries: getCardTypeFieldConfig(cardTypeId, statusId), getCardTypeFieldConfigAll(cardTypeId) (public read)
- Implement system admin authorization check on all mutations
- Query for impact count when changing to required: count cards in status missing the field
- Grandfathering: Store grandfathered card IDs or use created_at timestamp for enforcement
- Cache field configuration in frontend for performance

**Design System References:**
- Status selector: Horizontal pill buttons with status colors
- Field list: Draggable rows with @dnd-kit
- Requirement dropdown: shadcn/ui Select, compact style
- Remove button: X icon, var(--spacing-xl) hit target
- Clone button: Secondary button style
- Card preview: Real-time updates showing configured fields
- Visual indicators:
  - Required: Red asterisk (*) with var(--color-error)
  - Title field: Lock icon (🔒) with "Always Required" badge
- Auto-save indicator: Inline "Saving..." / "Saved" text
- Confirmation dialogs: shadcn/ui Dialog with impact message

---

## Story 3.5: Card Preview and Schema Validation

As a system administrator,
I want to preview how cards will look for each status and see validation warnings,
So that I can verify my configuration before it affects all projects.

**UX Design:** See Epic 3 UX Design Specification (`_bmad-output/planning-artifacts/epic-3-ux-design-specification.md`) - Card Type Detail screen, Card Preview section

**Acceptance Criteria:**

**Given** I am a system administrator on the Card Type Detail screen (Story 3.4)
**Then** I see a Card Preview section at the bottom of the page

**And** the Card Preview displays:
- Card type badge (icon, key, color) at the top
- Placeholder card ID (e.g., "BUG-###")
- All fields configured for the currently selected status
- Required fields marked with asterisk (*) in var(--color-error)
- Optional fields visible without indicator
- Fields shown as disabled form inputs in configured order
- Default values pre-filled where configured

**And** the preview updates in real-time as I:
- Add or remove fields from the status
- Change field requirement (required/optional)
- Reorder fields
- Switch to a different status

**And** when I switch status using the status selector:
- Preview immediately updates to show fields for new status
- I can compare different statuses to verify workflow makes sense

**And** validation warnings appear in the Card Type Detail screen if:
- No fields are configured for a status (besides Title)
  - Warning: "No additional fields configured for '[Status]'"
- A field is required in a later status but not present in earlier statuses
  - Warning: "[Field] is required in '[Status B]' but not available in '[Status A]'"
- Warnings use shadcn/ui Alert component with warning icon

**And** the preview is an approximation (not pixel-perfect):
- Shows field structure and order
- Admin understands what the card will look like
- Not a fully functional form (inputs are disabled)

**Prerequisites:** Story 3.4

**Technical Notes:**
- Build CardPreview component that renders based on field configuration
- Implement real-time preview updates (debounced for performance)
- Use actual field components in disabled/preview mode
- Add schema validation logic to detect configuration issues
- Validation runs on configuration change, not just on save
- Warnings are informational, not blocking

**Design System References:**
- Card Preview: Card component with header and body
- Card type badge: Icon + key + color, var(--font-mono) for key
- Field inputs: Actual shadcn/ui form components in disabled state
- Required indicator: var(--color-error) asterisk (*)
- Validation warnings: shadcn/ui Alert with var(--color-warning) styling
- Real-time updates: Debounced (var(--duration-slow)) to prevent excessive re-renders
- Spacing: Preview uses var(--spacing-md) between fields
- Animation: Smooth transitions (var(--duration-normal)) when switching status

---
