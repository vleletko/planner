# Epic 5: Card Lifecycle & Board Operations

**Goal:** Enable users to create, view, edit, and transition cards through workflow stages with validation enforcement. This epic delivers the core kanban board interface where users spend most of their time managing work items.

**Design System Note:** All design values must use design tokens from the design system. See docs/ux-design-specification.md for token definitions.

**UX Design References:**
- Overall design direction: Balanced Standard (Section 4.1)
- Core interaction: "Move cards with confidence" (Section 2.1)
- Color theme: Balanced Teal with semantic validation colors (Section 3.1)
- Design tokens: Section 6.2 - CSS variables for colors, typography, spacing, borders
- Design system: shadcn/ui (New York style) + Tailwind CSS (Section 1.1)
- Drag-and-drop: @dnd-kit with anime.js animations (Section 1.1)
- Key user journeys: Card transition (Section 5.2), Card creation (Section 5.3)

## Story 5.1: Card Creation with Field Validation

As a user,
I want to create cards with all required fields,
So that I can add work items to my project.

**Acceptance Criteria:**

**Given** I am viewing the board
**When** I click "Add Card" in any status column
**Then** I see a card creation dialog

**And** the creation dialog shows:
- Card type selector (dropdown with icons and colors)
- Title field (always required)
- All fields required or optional for the selected status
- Fields with default values pre-filled
- Field requirement indicators (asterisk * for required)

**And** when I select a card type:
- Form updates to show fields for that card type
- Default values are applied
- Conditional fields appear/disappear based on default values
- Field order matches configuration

**And** validation works as I fill the form:
- Sync validation on field blur (instant feedback)
- Async validation on field blur (shows loading state)
- Required fields show error if empty on blur
- Format validation shows inline errors
- Cross-field validation updates dynamically

**And** when I click "Create Card":
- All required fields are validated
- Async validations complete before creation
- Card is created and appears in the selected status column
- Dialog closes and card is visible immediately
- Success toast notification appears

**And** if validation fails:
- Dialog stays open with errors highlighted
- First invalid field is focused
- Submit button remains disabled
- Clear error messages explain what to fix

**And** I can cancel card creation:
- "Cancel" button closes dialog
- No card is created
- Confirmation prompt if form has unsaved changes

**Prerequisites:** Story 4.6

**UX Design Notes:**

**See UX Design Spec: Section 5.1 - Critical User Paths (Inline Editing Pattern)**

- **Pattern:** Inline editing (Section 5.1) - card appears immediately in draft state
- **Visual design:** Dashed border using var(--color-border) with opacity for draft state, "DRAFT" badge
- **Card type selector:** Dropdown with icons and colors matching card type configuration
- **Field disclosure:** Progressive - required fields visible, optional fields under "Show more fields"
- **Validation feedback:** Real-time sync validation on blur, async validation with loading states
- **Colors:**
  - Active states: var(--color-primary)
  - Valid: var(--color-success)
  - Errors: var(--color-error)
  - Pending: var(--color-warning)
- **Typography:**
  - Font family: var(--font-sans)
  - Body text: var(--text-base)
  - Title field: var(--text-lg)
- **Spacing:**
  - Base unit: var(--spacing-xs)
  - Between fields: var(--spacing-md)
  - Section spacing: var(--spacing-lg)
- **Success state:** Success toast notification, draft border → solid border, "DRAFT" badge removed
- **Performance:** Card appears <50ms, field transform <100ms, create success <500ms

**Technical Notes:**
- Add ORPC mutation: createCard
- Create card creation component using inline editing pattern (not dialog)
- Implement dynamic form rendering based on card type
- Apply default values on card type selection
- Validate all required fields before submission
- Use shadcn/ui form components with error state variants
- Use optimistic UI update (show card immediately in draft state)
- Rollback on server error with error toast (shadcn/ui Toaster)
- Store card with status, card_type, field values
- Integrate Lucide icons for UI elements, emoji for card type icons

---

## Story 5.2: Card Detail View and Editing

As a user,
I want to view and edit card details,
So that I can update work items as they progress.

**Acceptance Criteria:**

**Given** a card exists on the board
**When** I click the card
**Then** I see a card detail view (modal or side panel)

**And** the detail view displays:
- Card type badge (with icon, key, and color)
- Title (large, prominent)
- Current status indicator
- All field values organized in sections
- Card metadata: created date, creator, last updated
- Edit button

**And** read-only view shows:
- All visible fields for current status (hidden fields not shown)
- Rich text fields rendered with formatting
- File attachments with download links and thumbnails
- User assignment with avatar and name
- Dates formatted for readability
- Empty fields show as "Not set" or similar placeholder

**And** when I click "Edit":
- Fields become editable
- Only fields visible for current status are shown
- Required fields for current status marked with asterisk
- Validation rules apply as configured
- "Save" and "Cancel" buttons appear

**And** when editing:
- I can modify any visible field value
- Sync validation on field blur
- Async validation on field blur (with loading states)
- Conditional fields show/hide based on values
- Cross-field validation updates dynamically

**And** when I click "Save":
- All validations run
- Changes persist to database
- Detail view updates to read mode
- Last updated timestamp updates
- Success toast notification appears

**And** if I click "Cancel":
- All changes are discarded
- Fields revert to original values
- Confirmation prompt if changes exist

**Prerequisites:** Story 5.1

**UX Design Notes:**

**See UX Design Spec: Section 5.1 - Critical User Paths (Inline Editing Pattern)**

- **Pattern:** Inline editing (Section 5.1) - "View mode is edit mode"
- **Layout:** Modal or side panel (shadcn/ui Dialog/Sheet component)
- **Visual hierarchy:** Card type badge → Title (large) → Status → Field sections → Metadata
- **Card type badge:** Icon + key + color, positioned prominently at top
- **Inline editing triggers:** Hover reveals edit affordance, click activates appropriate field editor
- **Field editors by type:** Text (inline input), Rich text (textarea with markdown toolbar), Dropdown (inline selector), Date (date picker), User (avatar selector), Resource (selector with validation status)
- **Auto-save:** Save on blur for simple fields, explicit "Save" button for rich text
- **Validation colors:**
  - Valid: var(--color-success-light) background
  - Invalid: var(--color-error-light) background
  - Pending: var(--color-warning-light) background
- **Typography:**
  - Font family: var(--font-sans)
  - Title: var(--text-3xl) with var(--font-bold)
  - Body fields: var(--text-base)
  - Metadata: var(--text-sm)
- **Spacing:**
  - Field spacing: var(--spacing-md)
  - Section spacing: var(--spacing-lg)
- **Empty states:** "Not set" placeholder using var(--color-text-secondary)
- **Accessibility:** Proper label association, keyboard navigation (Tab, Enter, Escape), screen reader announcements

**Technical Notes:**
- Add ORPC mutations: updateCard, getCard
- Create card detail view component using shadcn/ui Dialog or Sheet
- Implement inline field rendering for all field types matching UX patterns
- Support field-level inline editing with validation
- Use optimistic updates for better UX
- Rollback on save failure with toast notification
- Query field requirements for current status
- Store field values in card_field_values table
- Implement markdown preview for rich text fields

---

## Story 5.3: Kanban Board Layout and Rendering

As a user,
I want a visual board with columns for each status,
So that I can see all work items organized by their current stage.

**Acceptance Criteria:**

**Given** I navigate to a project
**When** the board loads
**Then** I see a horizontal kanban board layout

**And** the board displays:
- One column per status (in configured order, left to right)
- Column headers with status name and color
- Card count per column in header
- "Add Card" button in each column header
- Empty state message in columns with no cards

**And** each card displays:
- Title (truncated if long)
- Card type badge (colored, with icon and key)
- Assignee avatar (if assigned)
- Visual indicators for validation errors (if any)
- Compact view suitable for scanning many cards

**And** column layout:
- Fixed width columns (e.g., 320px)
- Scrollable card list within each column
- Horizontal scroll for many statuses
- Responsive width on mobile (stacked or swipeable)

**And** empty columns show:
- Status name and color
- "No cards" placeholder
- "Add Card" button prominently

**And** board performance:
- Loads in under 2 seconds with 1000+ cards
- Smooth scrolling in columns
- No jank during card rendering

**Prerequisites:** Story 5.2

**UX Design Notes:**

**See UX Design Spec: Section 4.1 - Chosen Design Approach (Balanced Standard)**

- **Design direction:** Balanced Standard - information-rich without clutter (Section 4.1)
- **Application frame:** Fixed header (toolbar with branding, project selector, search, "+ New Card", user avatar), optional filter bar, scrollable board content
- **Board layout:** Horizontal kanban with vertical status columns, max-width 1280px container
- **Column design:**
  - Background: var(--color-background)
  - Hover: var(--color-background-secondary)
  - Clear status labels, card counts in headers
  - Spacing between columns: var(--spacing-lg)
- **Card visual hierarchy:**
  1. Title (var(--text-lg) with var(--font-semibold)) + Card ID badge (var(--font-mono), var(--text-sm))
  2. Validation status badge:
     - Valid: ✓ var(--color-badge-valid)
     - Incomplete: ⚠ var(--color-badge-pending)
     - Invalid: ✗ var(--color-badge-invalid)
  3. Metadata section with subtle border: Resource (icon + name), Assignee (avatar + name)
- **Card styling:**
  - Background: var(--color-background)
  - Borders: var(--color-border) (1px)
  - Border radius: var(--radius-md)
  - Elevation: var(--shadow-md)
  - Spacing between cards: var(--spacing-md)
- **Empty states:** "No cards" placeholder, prominent "Add Card" button
- **Typography:**
  - Font family: var(--font-sans) throughout
  - Card titles: var(--text-lg)
  - Metadata: var(--text-base)
  - Badges: var(--text-sm)
- **Icons:** Lucide icons for UI, emoji for resource types
- **Colors:** Validation badges use semantic color tokens, var(--color-primary) for accents
- **Performance:** Smooth scrolling, <2s load with 1000+ cards, no jank during rendering
- **Responsive:** Fixed width columns (320px) on desktop, horizontal scroll for many statuses

**Technical Notes:**
- Add ORPC query: getProjectBoard (returns all cards grouped by status)
- Create board layout component with column structure following design direction
- Implement card component for compact display with validation status indicators
- Use virtualization for columns with many cards (e.g., react-virtual or @tanstack/react-virtual)
- Optimize card rendering with React.memo
- Implement horizontal scroll container with Tailwind
- Query optimization: load all cards for project at once with status/type joins
- Use shadcn/ui components for headers, badges, and empty states
- Consider pagination or lazy loading for very large boards
- Implement smooth 60fps scrolling performance

---

## Story 5.4: Drag-and-Drop Card Movement

As a user,
I want to drag cards between status columns,
So that I can quickly update work item progress.

**Acceptance Criteria:**

**Given** the board is displayed
**When** I drag a card from one column to another
**Then** the card moves smoothly with visual feedback

**And** during drag:
- Card becomes semi-transparent or elevated
- Drop targets (status columns) are highlighted
- Current position indicator shows where card will land
- Smooth 60fps animation
- Touch-friendly on tablets

**And** when I drop in a different status:
- System validates required fields for target status
- If all required fields are filled and valid → card moves immediately
- If fields missing or invalid → transition dialog appears

**And** when I drop in the same column (reorder):
- Card position updates within column
- No validation required
- Position persists (saved to database)
- No status change occurs

**And** drag-and-drop provides:
- Visual feedback of drag state
- Cancel drag with Escape key
- Auto-scroll when dragging near edges
- Keyboard accessibility (arrow keys to move)

**And** optimistic UI updates:
- Card appears in new position immediately
- Rollback if server operation fails
- Error toast if move fails

**Prerequisites:** Story 5.3

**UX Design Notes:**

**See UX Design Spec: Section 5.2 - Journey 1: Card Transition with Validation**

- **Library:** @dnd-kit (core + sortable) for accessibility and keyboard navigation (Section 1.1)
- **Animation:** anime.js for smooth card tilt and elevation transitions (Section 1.1)
- **Drag feedback (Section 5.2):**
  - Card tilts 3-5° using anime.js
  - Elevation increases: var(--shadow-md) → var(--shadow-xl)
  - Background tint: var(--color-background) → var(--color-background-secondary) with increased saturation
  - Cursor changes to grabbing
  - Original position maintains ghost/placeholder
- **Drop zone highlighting:**
  - Valid columns: var(--color-background-secondary) background
  - Invalid zones: "not-allowed" cursor
- **Performance:** 60fps continuous drag tracking, <100ms optimistic card placement
- **Visual states:** Semi-transparent during drag, elevated shadow, smooth snap animation on drop
- **Touch support:** Touch-friendly on tablets with same visual feedback
- **Keyboard accessibility:** Arrow keys to move between columns, Enter to confirm, Escape to cancel
- **Auto-scroll:** When dragging near edges of viewport or column
- **Colors:**
  - Active drag state: var(--color-background-secondary)
  - Valid drop zones: var(--color-background-secondary)
- **Animation timing:** var(--duration-slow) for snap animation with var(--ease-out) easing

**Technical Notes:**
- Use @dnd-kit (core + sortable packages) as specified in UX design
- Integrate anime.js for card tilt animation during drag
- Add ORPC mutation: moveCard, reorderCard
- Implement drag event handlers with visual feedback states
- Check field requirements before allowing status change
- Optimistic update with rollback on error, show error toast on failure
- Store card position in status column for ordering
- Ensure smooth 60fps performance target
- Support both mouse and touch input
- Implement keyboard navigation for accessibility (WCAG 2.1 AA)
- Add auto-scroll when dragging near viewport edges

---

## Story 5.5: Status Transition Dialog with Validation

As a user,
I want guidance when moving cards to ensure I complete required fields,
So that I meet workflow requirements before advancing work items.

**Acceptance Criteria:**

**Given** I drag a card to a new status
**When** the card has missing or invalid required fields for target status
**Then** a transition dialog appears

**And** the transition dialog shows:
- Clear title: "Complete these fields to move to [Status Name]"
- Current status → new status indicator
- All fields required for target status
- Current values for already-filled fields (editable)
- Missing fields highlighted in red
- Validation errors for invalid fields

**And** the dialog includes:
- All required fields for target status (even if already filled)
- Optional fields for target status (expandable section)
- Field requirement indicators (asterisk for required)
- Validation state for each field (pending, valid, invalid)

**And** validation works in transition dialog:
- Sync validation on field blur
- Async validation on field blur (with loading spinner)
- Resource field validation (checks resource validity)
- Cross-field validation
- Conditional field logic applies

**And** when all validations pass:
- "Move to [Status]" button becomes enabled
- Button shows loading state during submission
- Card moves to new status
- Dialog closes
- Success notification appears

**And** if validation fails:
- "Move to [Status]" button stays disabled
- Clear error messages show what needs fixing
- First invalid field is focused
- User can fix errors and retry

**And** user can cancel transition:
- "Cancel" button returns card to original status
- No changes are saved
- Dialog closes

**And** for resource reference fields:
- Shows resource validation status
- If resource is invalid → error: "Resource [name] validation failed: [message]"
- Provides link to re-validate resource
- Blocks transition until resource is valid

**Prerequisites:** Story 5.4

**UX Design Notes:**

**See UX Design Spec: Section 2.2 - Novel UX Patterns (Validation-Driven Transition Dialog) & Section 5.2 - Journey 1**

- **Pattern:** Validation-driven transition dialog - Planner's novel UX pattern (Section 2.2)
- **Trigger:** Appears only when required fields missing/invalid for target status
- **Optimistic UI approach (Section 5.2):**
  - Card appears in new column immediately with overlay (opacity 0.6, var(--color-overlay))
  - Small spinner in top-right corner
  - Validation runs in background (<1s for sync, <5s for async)
  - Success: Overlay fades out with var(--transition-fade), brief glow using var(--color-success)
  - Failure: Dialog opens with var(--duration-slow) slide-up animation
- **Dialog layout (shadcn/ui Dialog):**
  - Header: "Complete these fields to move to [Status Name]"
  - Subtitle: "[CARD-ID]: [Card Title]"
  - Form shows only missing/invalid required fields (not all fields)
  - Fields pre-filled with current values
- **Validation feedback:** Real-time inline validation as user types
  - Success: Checkmark, var(--color-success) border, var(--color-success-light) background
  - Error: Error message below field, var(--color-error) border, var(--color-error-light) background
  - Loading: Spinner next to field, var(--color-warning-light) background, disabled state
- **Resource validation:** Specific error messages with "View Resource Details →" link
- **Action buttons:**
  - Primary: "Move to [Status Name]" (var(--color-primary), disabled until valid)
  - Secondary: "Cancel" (var(--color-secondary))
- **Cancel/Recovery:** Card animates back to original column with var(--duration-slower) using var(--ease-out)
- **Typography:**
  - Header: var(--text-2xl) with var(--font-semibold)
  - Body fields: var(--text-base)
  - Error messages: var(--text-sm)
- **Spacing:**
  - Field spacing: var(--spacing-md)
  - Section spacing: var(--spacing-lg)
- **Accessibility:** Focus trap, Tab cycles fields, Escape closes, screen reader announcements

**Technical Notes:**
- Create status transition dialog component using shadcn/ui Dialog
- Implement optimistic UI with gray overlay and spinner
- Query field requirements for target status
- Load current field values
- Implement validation orchestration (sync + async + resource)
- Show inline validation feedback with color-coded states
- Check resource validation status if resource fields exist
- Add ORPC mutation: transitionCard (validates before moving)
- Use database transaction for card update
- Rollback on validation failure with smooth animation back to original column
- Log transition in activity history
- Implement 300ms dialog open animation (slide-up)
- Add success animation (green glow border, 500ms fade)

---

## Story 5.6: Card Reordering Within Status

As a user,
I want to reorder cards within a status column,
So that I can prioritize work items.

**Acceptance Criteria:**

**Given** multiple cards exist in a status column
**When** I drag a card up or down within the same column
**Then** the card's position changes

**And** reordering works:
- Drag card to new position within column
- Cards shift to make space during drag
- Drop releases card in new position
- Position persists across page reloads
- No validation required (same status)

**And** visual feedback during reorder:
- Dragged card is elevated/highlighted
- Drop indicator line shows insertion point
- Other cards animate to new positions
- Smooth 60fps performance

**And** position updates:
- Save immediately on drop
- Optimistic UI update (no waiting)
- Rollback if server save fails
- Position stored as numeric order field

**And** keyboard accessibility:
- Select card with Enter
- Move up/down with arrow keys
- Drop with Enter
- Cancel with Escape

**Prerequisites:** Story 5.5

**UX Design Notes:**

**See UX Design Spec: Section 5.2 - Journey 1: Card Transition with Validation (Drag mechanics apply to reordering)**

- **Pattern:** Same drag-and-drop interaction as Story 5.4, within same column
- **Visual feedback:**
  - Drop indicator line shows insertion point (var(--color-primary), 2px height)
  - Cards animate to new positions with smooth transitions
  - Dragged card elevated with var(--shadow-xl)
  - 60fps smooth animation performance
- **Animation:** Cards shift to make space during drag (var(--duration-slow) with var(--ease-out))
- **No validation:** Since status unchanged, no validation dialog appears
- **Optimistic UI:** Position updates immediately, rollback on server error
- **Keyboard accessibility:** Select card (Enter) → Move up/down (arrow keys) → Drop (Enter) → Cancel (Escape)
- **Performance:** <100ms position update, smooth 60fps during reorder animation
- **Colors:**
  - Drop indicator line: var(--color-primary)
  - Dragged card background: var(--color-background-secondary)

**Technical Notes:**
- Add position/order field to cards table
- Add ORPC mutation: reorderCard (updates position)
- Calculate new position between adjacent cards
- Use fractional indexing or re-rank strategy (LexoRank or similar)
- Optimize for minimal database updates
- Ensure consistent ordering across clients
- Handle concurrent reorder conflicts gracefully
- Implement smooth position transitions using Tailwind transitions or anime.js
- Use @dnd-kit sortable utilities for within-column reordering
- Ensure 60fps animation performance during card shifting

---

## Future Enhancement: Automated Card Validation & Transitions

**Concept:** Allow automated validation and status transitions when cards enter specific statuses.

**Use Cases:**
- Deployment card enters "Ready to Deploy" → validates deployment succeeded → auto-transitions to "Deployed"
- Bug fix card enters "Ready to Test" → runs automated tests → auto-transitions to "Tested" or back to "In Progress"
- Content card enters "Published" → checks if content is live → auto-transitions to "Live"
- Pull request card enters "Ready to Merge" → validates CI/CD passed → auto-transitions to "Merged"

**Implementation Approach:**

**Configuration (per card type + status):**
- Define trigger: "When card enters status X"
- Specify validation script/plugin to run
- Define success transition: "Move to status Y"
- Define failure transition: "Move to status Z" (optional, or stay in current status)

**Validation Execution:**
- Pluggable validator system (similar to resource types)
- Each card type can have custom validators
- Validators run asynchronously in background
- Return: `{ valid: boolean, message: string, data?: any }`
- Timeout handling (configurable, e.g., 5 minutes)

**Extensibility:**
- Validators defined in code by developers
- Card type specific (different validators per card type)
- Team can implement custom validators
- Examples:
  - HTTP endpoint validator (check if deployed)
  - Test runner validator (run test suite)
  - API validator (verify API endpoint works)
  - Database validator (check if migration applied)

**Background Processing:**
- Validation runs in background job queue
- Card shows "Validating..." status indicator
- User can view validation progress/logs
- On success: card auto-transitions to configured status
- On failure: card stays or transitions to failure status
- Activity log records: validation triggered, result, auto-transition

**User Experience:**
- When card enters trigger status, validation starts automatically
- Visual indicator shows validation in progress
- User can manually retry failed validation
- Notification sent on validation completion (optional)
- Can cancel/abort running validation

**Technical Architecture:**
```typescript
interface CardValidator {
  type: string; // e.g., "deployment", "test-run", "api-check"
  validate(card: Card, context: ValidationContext): Promise<ValidationResult>;
}

interface ValidationConfig {
  cardTypeId: string;
  triggerStatusId: string;
  validatorType: string;
  validatorConfig: Record<string, any>;
  successStatusId: string;
  failureStatusId?: string;
  timeoutSeconds: number;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  logs?: string[];
  data?: Record<string, any>;
}
```

**Benefits:**
- Ensures work is actually complete before advancing
- Reduces manual verification burden
- Catches deployment/integration issues early
- Provides audit trail of automated checks
- Highly customizable per team/project

**Implementation Considerations:**
- Requires background job processing system
- Needs validator plugin architecture
- Should have retry and error handling
- Validation logs should be visible to users
- Consider rate limiting for expensive validators
- Security: validators run with project permissions

**Recommended Epic:** Add as Epic 5.5 or separate Epic 11 in future iteration

---
