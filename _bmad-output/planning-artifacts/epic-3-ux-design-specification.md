---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
inputDocuments:
  - docs/ux-design-specification.md
  - docs/PRD.md
  - docs/epics/epic-3-global-schema-configuration.md
  - docs/architecture.md
---

# Epic 3: Global Schema Configuration - UX Design Specification

**Author:** master
**Date:** 2026-01-22
**Scope:** Admin screens for managing global workflow statuses, card types, and fields

---

## Context

This UX specification extends the main application UX design (`docs/ux-design-specification.md`) to cover the **Admin Schema Configuration** screens introduced in Epic 3.

**Key Constraint:** All designs must align with the existing design system:
- **Design System:** shadcn/ui (New York style) + Tailwind CSS
- **Theme:** Balanced Teal (`#14b8a6` primary)
- **Patterns:** Inline editing, drag-and-drop with @dnd-kit, toast notifications via sonner
- **Accessibility:** WCAG 2.1 AA compliance

---

## Executive Summary

### Project Vision

Epic 3 introduces admin-only screens for configuring the **global workflow schema** shared by all projects. System Administrators define statuses, fields, and card types that govern how work items are structured and validated across the entire organization.

### Target Users

**System Administrators** - A small group of power users responsible for maintaining workflow consistency across the organization. They understand configuration concepts, make changes carefully (knowing changes affect all projects), and are tech-savvy but not developers.

### Core Capabilities

**1. Create / Manage Statuses**
- Create status with name and color
- Reorder statuses via drag-and-drop (determines board column order)
- Edit status name/color
- Activate/deactivate status (deactivated statuses hidden from boards but preserved)
- Delete status (blocked if cards exist in that status)
- System provides defaults: Backlog, In Progress, Done (can be deactivated but not deleted)

**2. Create / Manage Fields**
- Create a field by selecting a field type (Text, Number, Date, Dropdown, Multi-Select) and configuring it
- Examples of fields:
  - "Summary" (Text field, single-line)
  - "Description" (Text field, multi-line)
  - "Priority" (Dropdown with options: High, Medium, Low)
  - "Due Date" (Date field)
- Configure field-specific options based on type:
  - **Text:** single-line or multi-line, min/max length, placeholder, default value
  - **Number:** integer/decimal, min/max value, step increment, default value
  - **Date:** format, min/max date constraints, default to today option, default value
  - **Dropdown:** options list (display name, value, optional color), default selected
  - **Multi-Select:** options list, min/max selection count, default selections
- Fields are global and reusable across card types
- Delete field (blocked if used in any card type)

**3. Create / Manage Card Types**
- Create card type with name, key (globally unique, immutable), color, and icon
- Edit card type properties (name, color, icon - key is immutable)
- Activate/deactivate card type (deactivated types can't be used for new cards)
- Delete card type (blocked if cards of that type exist)

**4. Configure Card Type Fields per Status**
- For each card type and status combination: select which fields are visible and whether each is required or optional
- "Title" field is always present and required for all statuses (system-enforced)
- Reorder fields via drag-and-drop (determines display order on card for that status)
- Clone field configuration from one status to another (then adjust as needed)

### Screen Structure

| Screen | Purpose |
|--------|---------|
| **Statuses** | List of statuses with drag-and-drop reordering. Click to edit name/color. Add/delete statuses. |
| **Fields** | List of preconfigured fields. Click to edit field configuration. Add/delete fields. |
| **Card Types** | List of card types. Click to open Card Type Detail. Add/delete card types. |
| **Card Type Detail** | Edit card type properties (name, color, icon). Status selector to switch between statuses. For selected status: add/remove fields, set each as required or optional, drag to reorder. Clone button to copy configuration to another status. Shows card-like layout that updates as you configure. |

### Key UX Challenges

1. **Communicating Global Impact** - Changes affect all projects. Make this clear without being intimidating.
2. **Preventing Destructive Actions** - Block deletion when items are in use; show friendly guidance instead of just an error.
3. **Field Configuration Depth** - Each field type has different options. Keep configuration discoverable but not overwhelming.

### Global Impact Communication

All admin schema screens include a persistent info banner:
> "Changes to the global schema affect all projects immediately."

This banner uses `var(--color-info)` background (subtle blue), appears once per session, and can be dismissed. It reinforces awareness without being alarming.

### Key Interaction Principle

**Edit in Context** - Fields are displayed in a card-like representation showing their order and structure. Select a field to edit it. The user understands what the card will look like without needing a pixel-perfect preview.

---

## Core User Experience

### Defining Experience

The core experience is **configuring card types for each workflow status**. Admins select which fields appear, whether they're required or optional, and see the result in a card-like preview. The experience must be clear enough that an admin who hasn't used it in months can immediately understand what they're doing.

### Platform Strategy

- **Web application** (desktop-first)
- **Mouse/keyboard** primary input
- Part of existing Planner app navigation: Admin → Schema → [Statuses | Fields | Card Types]
- No offline requirement - changes persist immediately

### Effortless Interactions

- **Status switching** - Clearly see which status is selected, switch with one click
- **Field reordering** - Drag-and-drop with immediate preview update
- **Clone configuration** - Copy one status's field setup to another, then adjust
- **Auto-save** - No "Save" button; changes persist automatically with visual confirmation

### Critical Success Moments

- **Seeing the preview update** - Admin configures a field, preview instantly reflects the change
- **Clone saves time** - Admin realizes they don't have to repeat configuration for similar statuses
- **Deletion blocked** - Admin tries to delete something in use, gets helpful guidance instead of cryptic error
- **Impact awareness** - Before making a field required, admin sees how many existing cards would be affected

### Configuration Change Behavior

When admin makes a field required for a status:
1. System shows impact: "X cards are currently in this status without this field"
2. Admin confirms the change
3. **Grandfathering:** Existing cards in that status are exempt
4. **Future enforcement:** Only new transitions into that status require the field

### Experience Principles

1. **Always Show Context** - Admin must always know: which card type, which status, what the result looks like
2. **Prevent Costly Mistakes** - Confirm destructive actions, block deletion of in-use items, warn about global impact
3. **Discoverability Over Speed** - Clear labels and guidance over keyboard shortcuts (infrequent use)
4. **Immediate Feedback** - Changes reflect instantly in the card-like preview, auto-save with visual confirmation
5. **Show Impact, Then Decide** - When changes affect existing data, show the impact and let admin make an informed choice

---

## Desired Emotional Response

### Primary Emotional Goal

**Confident and in control** - Admin is making changes that affect all projects. They need to trust they understand what they're doing and feel secure that the system will protect them from mistakes.

### Emotional Journey

| Stage | Desired Feeling |
|-------|-----------------|
| First discovery | "This looks manageable, not overwhelming" |
| During configuration | "I understand exactly what I'm changing" |
| After completing | "I've set this up correctly" |
| When blocked (deletion, etc.) | "The system protected me from a mistake" |

### Micro-Emotions

**Prioritize:**
- **Confidence** over confusion
- **Trust** in the preview (what I configure is what users see)
- **Accomplishment** when done, not relief that it's over

**Avoid:**
- Anxiety about breaking things
- Confusion about what's currently selected
- Frustration from unexpected side effects

### Design Implications

| Emotion | UX Approach |
|---------|-------------|
| Confidence | Always show current context (card type, status) prominently |
| Trust | Preview updates immediately - no "Apply" button, just see it |
| Protected | Deletion blocked with helpful message, not cryptic error |
| Accomplishment | Subtle success feedback (checkmark, toast) after changes |

### Emotional Design Principles

1. **Clarity breeds confidence** - Never leave admin guessing what they're editing
2. **Protection over restriction** - Block dangerous actions with guidance, not just errors
3. **Immediate feedback** - Every action has visible result, no waiting or wondering
4. **Low-stakes exploration** - Admin can browse and understand without fear of accidental changes

---

## UX Pattern Inspiration

### Reference Products

**Linear** (Issue Tracking)
- Clean, uncluttered settings organization
- Contextual help text that explains impact without overwhelming
- Smooth transitions between configuration states

**Notion** (Knowledge Management)
- Property configuration with type-specific options
- Drag-and-drop reordering with clear visual feedback
- Inline editing that feels natural and immediate

**Jira** (Project Management)
- Field configuration schemes with per-context requirements
- Clear indication when configuration affects existing items
- Structured navigation through complex settings

### Patterns to Adopt

| Pattern | Application |
|---------|-------------|
| **Sidebar + Detail** | Card Type list on left, detail/configuration on right |
| **Inline Editing** | Click any text to edit, save on blur |
| **Drag Handle Visibility** | Show drag handles on hover, not always |
| **Type Indicator Icons** | Each field type has a distinctive icon |
| **Status Pills** | Color-coded pills for status selection |
| **Impact Counts** | Show "Used by X cards" before deletion |

### Patterns to Avoid

- **Wizard flows** - Too rigid for exploratory configuration
- **Modal-heavy UX** - Interrupts flow; prefer inline editing
- **Hidden save buttons** - Auto-save with visual confirmation instead
- **Separate preview mode** - Show preview inline, always visible

---

## Information Architecture

### Navigation Structure

```
Admin (top nav)
└── Schema (sub-nav)
    ├── Statuses
    ├── Fields
    └── Card Types
        └── [Card Type Detail] (drill-down)
```

### Screen Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│ Admin → Schema → Statuses                                   │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ℹ️ Changes to the global schema affect all projects.    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Page Header: "Workflow Statuses"                        │ │
│ │ Subtitle: "Define the stages work items move through"   │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Status List (draggable)                                 │ │
│ │  • [color] Status Name      "X cards"  [toggle] [🗑]    │ │
│ │  • [color] Status Name      "X cards"  [toggle] [🗑]    │ │
│ │  • [color] Status Name (Inactive)       [toggle] [🗑]   │ │
│ │  • ...                                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [+ Add Status]                                              │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ Admin → Schema → Fields                                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Page Header: "Fields"                                   │ │
│ │ Subtitle: "Reusable fields available for card types"    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Field List                                              │ │
│ │  • [icon] Field Name (Type) - "Used by X card types"    │ │
│ │  • [icon] Field Name (Type) - "Used by X card types"    │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [+ Add Field]                                               │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ Admin → Schema → Card Types                                 │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Page Header: "Card Types"                               │ │
│ │ Subtitle: "Define work item types and their fields"     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Card Type List                                          │ │
│ │  • [icon] [color] Name (KEY) - "X cards"                │ │
│ │  • [icon] [color] Name (KEY) - "X cards"                │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [+ Add Card Type]                                           │
└─────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────┐
│ Admin → Schema → Card Types → Bug                           │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────┬───────────────────────────────────┤
│ │ Card Type Properties  │ Field Configuration               │
│ │                       │                                   │
│ │ Name: [Bug         ]  │ Status: [● Backlog ▾]            │
│ │ Key:  BUG (locked)    │                                   │
│ │ Color: [●]            │ Fields for this status:           │
│ │ Icon: [🐛]            │ ┌─────────────────────────────┐   │
│ │                       │ │ ≡ Title ★ (always required) │   │
│ │                       │ │ ≡ Description [Required ▾]  │   │
│ │                       │ │ ≡ Priority [Optional ▾]     │   │
│ │                       │ │ ≡ Assignee [Optional ▾]     │   │
│ │                       │ └─────────────────────────────┘   │
│ │                       │ [+ Add Field]                     │
│ │                       │                                   │
│ │                       │ [Clone to status...]              │
│ └───────────────────────┴───────────────────────────────────┤
│                                                             │
│ Card Preview (approximation):                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🐛 BUG-###                                              │ │
│ │ ─────────────────────────────────────────────────────── │ │
│ │ Title: _____________________________ *                  │ │
│ │ Description: _______________________ *                  │ │
│ │ Priority: [▾]                                           │ │
│ │ Assignee: [▾]                                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Content Priority

**Statuses Screen:**
1. Status list with visual order
2. Color indicators
3. Card count per status (for deletion protection context)
4. Active/inactive toggle
5. Add/edit/delete actions

**Fields Screen:**
1. Field name and type
2. Usage count (which card types use it)
3. Quick configuration preview
4. Add/edit/delete actions

**Card Types Screen:**
1. Card type identity (name, key, icon, color)
2. Card count
3. Navigation to detail

**Card Type Detail:**
1. Current status context (which status am I configuring?)
2. Field list for that status
3. Required/optional toggle per field
4. Card preview showing result
5. Clone action

---

## Interaction Design

### Statuses Screen

**Adding a Status:**
1. Click "Add Status" button
2. New row appears at bottom with focus on name input
3. Enter name (min 3 characters)
4. Click color picker to select color
5. Status saves automatically when name is valid and focus leaves

**Editing a Status:**
1. Click on status name text
2. Text transforms to input with primary color border
3. Edit name
4. Press Enter or click away to save
5. Press Escape to cancel

**Reordering Statuses:**
1. Hover over status row to reveal drag handle
2. Click and drag handle
3. Row lifts with subtle shadow and tilt
4. Drag to new position, insertion line shows where it will land
5. Release to drop
6. Order saves automatically

**Activating/Deactivating a Status:**
1. Each status row has a toggle or menu option for active/inactive
2. Deactivated statuses:
   - Shown with reduced opacity (50%)
   - Badge: "Inactive" in var(--color-text-muted)
   - Hidden from board views and status selectors
   - Existing cards in that status remain unchanged
3. Default statuses (Backlog, In Progress, Done) can be deactivated but not deleted
4. Toggle is instant with optimistic UI

**Deleting a Status:**
1. Click delete (trash) icon on status row
2. If status is a default (Backlog, In Progress, Done):
   - Toast: "Default statuses cannot be deleted. You can deactivate it instead."
3. If status has cards:
   - Toast appears: "Cannot delete 'Review' - X cards use this status"
   - No dialog, just informative toast
4. If status has no cards and is not default:
   - Confirmation dialog: "Delete 'Review' status? This cannot be undone."
   - Cancel / Delete buttons
   - On confirm, status fades out

### Fields Screen

**Adding a Field:**
1. Click "Add Field" button
2. Dialog appears with field type selector (large cards with icons)
3. Select field type (Text, Long Text, Number, Date, Dropdown, Multi-Select)
4. Dialog expands to show type-specific configuration:
   - Field name (required)
   - Type-specific options
5. Click "Create Field" to save
6. Field appears in list with fade-in

**Editing a Field:**
1. Click on field row
2. Slide-over panel opens from right (or dialog)
3. Edit field name and type-specific options
4. Changes save automatically (debounced)
5. Close panel when done

**Deleting a Field:**
1. Click delete icon on field row
2. If field is used by card types:
   - Toast: "Cannot delete 'Priority' - used by Bug, Task card types"
3. If field is unused:
   - Confirmation dialog: "Delete 'Priority' field? This cannot be undone."
   - On confirm, field fades out

### Card Types Screen

**Adding a Card Type:**
1. Click "Add Card Type" button
2. Dialog with form:
   - Name (required, auto-suggests key)
   - Key (auto-filled, editable, max 5 chars, uppercase)
   - Color picker
   - Icon picker (Lucide icons grid)
3. Click "Create" to save
4. Navigate to Card Type Detail

**Navigating to Detail:**
1. Click anywhere on card type row
2. Navigate to Card Type Detail screen
3. URL updates: `/admin/schema/card-types/[id]`

### Card Type Detail Screen

**Status Selector:**
1. Horizontal pill/tab bar showing all statuses
2. Active status has filled background
3. Click any status to switch context
4. Field list updates immediately

**Adding a Field to Status:**
1. Click "Add Field" button below field list
2. Dropdown shows available fields (from global field list)
3. Select a field
4. Field appears in list as "Optional" by default
5. Preview updates to show new field

**Setting Field Requirement:**
1. Each field row has a dropdown: "Required" / "Optional"
2. Click to change
3. If changing to "Required" and cards exist in this status missing the field:
   - Dialog: "X cards in 'In Progress' don't have this field filled. Make required anyway?"
   - Subtext: "Existing cards will be grandfathered. Only new transitions will require this field."
   - Cancel / Make Required buttons
4. Change applies, preview updates

**Removing a Field from Status:**
1. Click remove (X) icon on field row
2. Field is removed from this status (not deleted globally)
3. No confirmation needed (field still exists, just not on this status)
4. Preview updates

**Reordering Fields:**
1. Drag handle on left of each field
2. Drag to reorder
3. Preview updates to show new order
4. Order is per-status (different statuses can have different orders)

**Clone Configuration:** *(UX enhancement - not in original Epic 3)*
1. Click "Clone to status..." button
2. Dropdown shows other statuses
3. Select target status
4. Confirmation: "Copy field configuration from 'Backlog' to 'In Progress'? Existing configuration in 'In Progress' will be replaced."
5. On confirm, target status gets same fields with same required/optional settings

### Auto-Save Behavior

All screens use auto-save with visual feedback:
1. Change detected
2. Small "Saving..." indicator appears (spinner or text)
3. After save: "Saved" with checkmark, fades after 2 seconds
4. On error: "Failed to save" toast with retry option

### Keyboard Navigation

- **Tab**: Move between interactive elements
- **Enter**: Activate buttons, confirm inline edits
- **Escape**: Cancel inline editing, close dialogs
- **Arrow keys**: Navigate within drag-and-drop lists (with modifier key)

---

## Visual Design

### Layout

**Desktop (Primary):**
- Max content width: 1200px, centered
- Sidebar (when applicable): 300px fixed
- Main content: flexible
- Generous padding: var(--spacing-lg) around sections

**Responsive Behavior:**
- Tablet: Collapse sidebar to top nav
- Mobile: Stack all elements vertically (admin screens are desktop-first but should be usable)

### Component Specifications

**Status Row:**
```
┌─────────────────────────────────────────────────────────────┐
│ ≡  [●]  Status Name          "47 cards"    [toggle] [🗑]   │
└─────────────────────────────────────────────────────────────┘
     │    │                        │              │      │
     │    │                        │              │      └─ Delete icon
     │    │                        │              └─ Active/Inactive toggle
     │    │                        └─ Card count (muted text)
     │    └─ Color indicator (12px circle)
     └─ Drag handle (visible on hover)
```

- Height: 48px
- Background: var(--color-surface)
- Border: 1px var(--color-border)
- Border radius: var(--radius-md)
- Drag handle: var(--color-text-muted), 6-dot grip icon
- Card count: var(--text-sm), var(--color-text-muted)
- Toggle: shadcn/ui Switch component
- On hover: var(--color-hover) background
- On drag: var(--shadow-xl), 3° tilt
- Inactive state: 50% opacity, "Inactive" badge

**Field Row:**
```
┌─────────────────────────────────────────────────────────────┐
│ ≡  [📝]  Field Name            Text       [Required ▾]  [×]│
└─────────────────────────────────────────────────────────────┘
      │                           │               │          │
      └─ Type icon                │               │          └─ Remove from status
                                  │               └─ Requirement dropdown
                                  └─ Field type label
```

- Same styling as status row
- Type icon: Lucide icon matching field type
- Requirement dropdown: compact, no border until hover

**Card Type Badge:**
```
┌──────────────────┐
│ 🐛 BUG           │
└──────────────────┘
```

- Background: card type color at 10% opacity
- Border: 1px card type color
- Icon: 16px Lucide icon
- Key: var(--font-mono), var(--text-sm)
- Border radius: var(--radius-sm)

**Card Preview (Approximation):**
- Full-width within its container
- Background: var(--color-surface)
- Border: 1px var(--color-border)
- Border radius: var(--radius-lg)
- Header: Card type badge + placeholder ID
- Body: List of fields in configured order
- Required fields: Show asterisk (*) in var(--color-error)
- Fields shown as form inputs (disabled/preview state)

### Color Usage

| Element | Color Token |
|---------|-------------|
| Primary actions | var(--color-primary) |
| Destructive actions | var(--color-error) |
| Required indicator | var(--color-error) |
| Success feedback | var(--color-success) |
| Warning messages | var(--color-warning) |
| Muted text | var(--color-text-muted) |
| Borders | var(--color-border) |
| Hover states | var(--color-hover) |

### Curated Color Palette (Status/Card Type Colors)

Pre-validated colors for WCAG AA compliance (4.5:1 contrast with white text):

| Name | Hex | Usage |
|------|-----|-------|
| Slate | #475569 | Default/neutral |
| Red | #dc2626 | Blocked, critical |
| Orange | #ea580c | Warning, attention |
| Amber | #d97706 | Caution, pending |
| Green | #16a34a | Success, done |
| Teal | #0d9488 | Primary, in progress |
| Blue | #2563eb | Info, selected |
| Indigo | #4f46e5 | Feature, enhancement |
| Purple | #9333ea | Special, custom |
| Pink | #db2777 | Highlight |
| Rose | #e11d48 | Urgent |
| Cyan | #0891b2 | Review, testing |

Palette displayed as a grid of swatches. Click to select. Active selection has checkmark overlay.

### Typography

| Element | Style |
|---------|-------|
| Page title | var(--text-2xl), var(--font-semibold) |
| Page subtitle | var(--text-base), var(--color-text-muted) |
| List item name | var(--text-base), var(--font-medium) |
| Secondary text | var(--text-sm), var(--color-text-muted) |
| Card type key | var(--font-mono), var(--text-sm) |
| Button text | var(--text-sm), var(--font-medium) |

### Animation & Motion

| Interaction | Animation |
|-------------|-----------|
| Row added | Fade in, var(--duration-normal) |
| Row deleted | Fade out, var(--duration-normal) |
| Drag start | Scale 1.02, shadow elevation, 3° tilt |
| Drag over | Insertion line fades in |
| Drop | Settle into place, var(--duration-fast) |
| Panel open | Slide from right, var(--duration-normal) |
| Save indicator | Fade in/out, var(--duration-slow) |

---

## Accessibility

### Keyboard Support

- All interactive elements focusable via Tab
- Drag-and-drop has keyboard alternative (Arrow keys with modifier)
- Focus visible outline: 2px var(--color-primary)
- Focus trap in modals/dialogs
- Escape closes any open modal

### Screen Reader Support

- Page landmarks: main, nav, region
- List items announced with position ("Status 2 of 5")
- Drag-and-drop instructions announced
- Status changes announced ("Status order saved")
- Form validation errors associated with inputs

### Color & Contrast

- All text meets WCAG AA (4.5:1 minimum)
- Status/card type colors use curated palette (all options pre-validated for contrast)
- Don't rely on color alone (icons + text labels)
- Focus indicators visible in all themes

### Motion & Animation

- Respect `prefers-reduced-motion`
- Disable tilt/scale on drag for reduced motion
- Keep fade transitions (less jarring)

---

## Error States & Edge Cases

### Empty States

**No Statuses (shouldn't happen - system provides defaults):**
- Message: "No statuses defined. Add your first status to get started."
- Primary action: "Add Status" button

**No Fields:**
- Message: "No fields defined yet."
- Subtext: "Create reusable fields that can be added to card types."
- Primary action: "Add Field" button

**No Card Types:**
- Message: "No card types defined yet."
- Subtext: "Card types define the structure of work items."
- Primary action: "Add Card Type" button

**No Fields on Status (Card Type Detail):**
- Message: "No fields configured for this status."
- Subtext: "Add fields from your field library."
- Primary action: "Add Field" button

### Error States

**Save Failed:**
- Toast notification: "Failed to save changes. Please try again."
- Include retry button in toast
- Don't lose user's unsaved changes

**Deletion Blocked:**
- Toast notification with specific reason
- Example: "Cannot delete 'In Progress' - 47 cards use this status"
- No retry needed, just informative

**Network Error:**
- Banner at top of page: "Connection lost. Changes may not be saved."
- Auto-retry connection
- Clear banner when reconnected

### Validation

**Status Name:**
- Minimum 3 characters
- Show inline error if too short
- Block save until valid

**Card Type Key:**
- Auto-uppercase
- Max 5 characters
- Alphanumeric only
- Must be globally unique
- Show inline error if duplicate

**Field Configuration:**
- Type-specific validation (e.g., dropdown must have at least one option)
- Show inline errors
- Block save until valid

---

## Implementation Notes

### Component Hierarchy

```
AdminLayout
├── AdminNav (Statuses | Fields | Card Types)
├── StatusesPage
│   └── StatusList
│       └── StatusRow (draggable)
├── FieldsPage
│   └── FieldList
│       └── FieldRow
│           └── FieldConfigPanel (slide-over)
├── CardTypesPage
│   └── CardTypeList
│       └── CardTypeRow
└── CardTypeDetailPage
    ├── CardTypeProperties
    ├── StatusSelector
    ├── FieldConfigurationList
    │   └── ConfiguredFieldRow (draggable)
    └── CardPreview
```

### State Management

- Use React Query for server state (lists, CRUD operations)
- Optimistic updates for immediate feedback
- Invalidate related queries on mutation (e.g., updating a status invalidates card type previews)

### Drag-and-Drop

- Use @dnd-kit library (already in project)
- Keyboard accessible (Ctrl+Shift+Arrow)
- Touch support for tablets
- Announce position changes to screen readers

### Data Dependencies

- Statuses: Independent, load first
- Fields: Independent, load first
- Card Types: Depends on fields for available field list
- Card Type Detail: Depends on statuses for selector, fields for available list

---

## Self-Review Notes

### Alignment with Epic 3

| Requirement | Coverage |
|-------------|----------|
| Status CRUD | ✓ Full |
| Status reordering | ✓ Full |
| Status activate/deactivate | ✓ Added (was missing) |
| Default statuses protected | ✓ Added |
| Card Type CRUD | ✓ Full |
| Card Type activate/deactivate | ✓ Added (was missing) |
| Field definition (5 types) | ✓ Full |
| Field requirements per status | ✓ Full |
| System admin only | ✓ Implied (all screens in Admin area) |

### UX Enhancements Beyond Epic 3

These additions came from collaborative design discussion:

1. **Clone configuration** - Copy field setup from one status to another (noted as enhancement)
2. **Grandfathering behavior** - Existing cards exempt when fields become required
3. **Global impact banner** - Persistent reminder that changes affect all projects

### Design Decisions

1. **Inactive items shown inline** - Inactive statuses/card types remain in their position (not moved to bottom). This preserves intended order when reactivated.

2. **Inactive items can be reordered** - Drag-and-drop works for all items regardless of active state. Order is preserved for when item is reactivated.

3. **Curated color palette** - Instead of validating arbitrary colors, provide a curated palette of 12-16 colors that all meet WCAG AA contrast requirements. No validation needed at selection time because all options are pre-validated.

---
