# Epic 4: Field Types & Validation Framework

**Goal:** Support diverse field types with comprehensive validation capabilities including synchronous validation, asynchronous external API validation, conditional logic, and custom validation rules. This epic ensures data quality and enforces business rules at status transitions.

**Design Token Reference:**
All design values must use design tokens from the design system. See docs/ux-design-specification.md for token definitions.

**UX Design References:**
- Inline editing pattern for all field types (UX Spec §5.1, §5.4)
- Validation feedback patterns and states (UX Spec §7.3, §7.4)
- Field editor components and interactions (UX Spec §6.5)
- Color system for validation states (UX Spec §3.1, §6.2)
- Design tokens for consistent styling (UX Spec §6.2)

## Story 4.1: Rich Text and User Assignment Fields

**UX Design Reference:** See UX Design Spec: Section 6.5 - Key Architectural Components (Field Editors)

As a project owner,
I want rich text editing and user assignment field types,
So that cards can have formatted descriptions and clear ownership.

**Acceptance Criteria:**

**Given** I am configuring fields for a card type
**When** I add a new field and select "Rich Text" type
**Then** I can configure:
- Editor type: Markdown or WYSIWYG
- Toolbar options (bold, italic, lists, links, code blocks)
- Max content length
- Default value (with formatting)

**And** when users interact with rich text fields:
- Markdown editor shows live preview
- WYSIWYG editor provides formatting toolbar
- Links are clickable in view mode
- Code blocks have syntax highlighting
- Content is sanitized to prevent XSS
- **UX Design:** Uses inline editing pattern with markdown toolbar (**B** *I* `Code` > Quote - List • List [Link]), preview toggle, explicit "Save" button (UX Spec §5.2 step 5, §5.4 step 4)

**And** when I add a "User Assignment" field:
- I can configure single user selection only
- Default value can be set to "Current User" or specific user
- Field displays user avatar and name

**And** when users interact with user assignment fields:
- Dropdown shows all project members
- Search/filter members by name
- Avatar and name display in card view
- Only project members can be assigned
- **UX Design:** User selector dropdown with avatars (var(--spacing-xl) circles with initials) and names, inline search functionality, saves immediately on selection (UX Spec §5.2 step 5, §5.4 step 4). Avatar + name shown in view mode, color-coded background for avatars

**Prerequisites:** Story 3.5

**Technical Notes:**
- Integrate markdown editor (e.g., react-markdown, marked)
- Use DOMPurify for XSS prevention on rich text
- Consider WYSIWYG library (e.g., TipTap, Lexical)
- User assignment field references project_members table
- Create user picker component with search
- Store rich text as sanitized HTML or markdown
- Add syntax highlighting for code blocks
- **Design System:** Build `<RichTextEditor>` and `<UserSelector>` components following inline editing pattern (UX Spec §6.5). Use design tokens for colors: var(--color-primary) border on active, avatars with color backgrounds, hover states with var(--color-hover) (UX Spec §6.2)

---

## Story 4.2: File Attachment Field Type

**UX Design Reference:** See UX Design Spec: Section 5.4 - Journey 2 (Card Creation), Section 6.5 - Key Architectural Components

As a user,
I want to attach files to cards,
So that I can provide supporting documentation and assets.

**Acceptance Criteria:**

**Given** a card type has a file attachment field
**When** I view or edit a card
**Then** I see an upload area for the file attachment field

**And** I can upload files by:
- Clicking "Choose File" button
- Dragging and dropping files
- Selecting multiple files (if configured)
- **UX Design:** Uses "+ Add File" button in view mode, file picker opens on click. Drag-and-drop area with hover state highlighting (UX Spec §5.4 step 4)

**And** file upload provides:
- Progress indicator during upload
- File type validation (configurable allowed types)
- File size validation (configurable max size)
- Error messages for validation failures

**And** when configuring file attachment fields:
- Set allowed file types (e.g., "image/*", ".pdf", ".docx")
- Set max file size (e.g., 10MB)
- Allow multiple files or single file only
- Set required file count (min/max)

**And** uploaded files show:
- File name and size
- Preview thumbnail for images
- Download link
- Delete button (in edit mode)
- **UX Design:** List of attached files with icons, download icon appears on hover. Delete button (trash icon, var(--spacing-xl) hit target) appears on hover per file (UX Spec §5.4 step 4, §7.2 for icon buttons)

**And** files are:
- Stored securely (signed URLs for access)
- Scanned for malware on upload
- Only accessible to project members

**Prerequisites:** Story 4.1

**Technical Notes:**
- Use cloud storage (S3, Cloudflare R2, or similar)
- Generate signed URLs for secure file access
- Implement file type validation on client and server
- Add virus scanning integration (ClamAV or cloud service)
- Create file upload component with progress tracking
- Store file metadata in database (name, size, type, url)
- Implement file cleanup for deleted cards
- Consider image optimization for thumbnails
- **Design System:** Build `<FileUploadProgress>` component with progress bar (UX Spec §6.5). Use inline error pattern for validation failures with var(--color-error) text on var(--color-error-light) background and error message (UX Spec §6.2, §7.3). File icons using Lucide icon library

---

## Story 4.3: Synchronous Validation Rules

**UX Design Reference:** See UX Design Spec: Section 7.3 - Validation Feedback Patterns, Section 7.4 - Error States

As a project owner,
I want to define validation rules that check instantly,
So that users get immediate feedback on data entry.

**Acceptance Criteria:**

**Given** I am configuring a field
**When** I navigate to the validation tab
**Then** I can add synchronous validation rules

**And** for text fields, I can validate:
- Required (non-empty)
- Min/max length
- Email format
- URL format
- Phone number format
- Custom regex pattern
- Custom error message per rule

**And** for number fields, I can validate:
- Required
- Min/max value
- Must be integer (no decimals)
- Must be positive/negative

**And** for date fields, I can validate:
- Required
- Must be future date
- Must be past date
- Min/max date range
- Relative constraints (e.g., "within 30 days from today")

**And** validation executes:
- Instantly on field blur (<100ms)
- Before status transition
- Error displays inline below field
- Multiple validation errors show in order of priority
- **UX Design:** Inline error messages appear below field with var(--color-error) text on var(--color-error-light) background, error icon included. Field border turns var(--color-error). Multiple errors stack vertically with var(--spacing-sm) spacing (UX Spec §7.3, §7.4)

**And** I can configure custom error messages:
- Default: "Email format is invalid"
- Custom: "Please enter a valid work email address"

**Prerequisites:** Story 4.2

**Technical Notes:**
- Create validation rule engine with rule registry
- Support common formats: email, URL, phone, postal code
- Use regex validation for custom patterns
- Store validation rules in field config JSON
- Implement client-side validation with same rules as server
- Create reusable validation UI components
- Add validation rule builder UI with preview
- Consider using validation library (zod, yup) for type safety
- **Design System:** Build `<InlineError>` component with error icon and message (UX Spec §6.5). Use validation color tokens: var(--color-error), var(--color-error-light) for backgrounds (UX Spec §6.2). Ensure <100ms performance target for sync validation

---

## Story 4.4: Asynchronous Validation UI Support

**UX Design Reference:** See UX Design Spec: Section 7.2 - Button Hierarchy, Section 7.3 - Validation Feedback Patterns

As a user,
I want clear feedback when field validation takes time to complete,
So that I understand the system is working and know when I can proceed.

**Acceptance Criteria:**

**Given** a field type implements async validation in its code
**When** a user fills in that field and triggers validation
**Then** the UI shows appropriate loading and result states

**And** during async validation (field type is validating):
- Field shows loading spinner and "Validating..." state
- Submit button is disabled while any field is validating
- User can edit other fields while validation is in progress
- User can cancel the entire operation (close dialog/form)
- **UX Design:** Spinner appears next to field with "Validating..." text in var(--color-warning) color, field has var(--color-warning-light) background tint. Submit button shows disabled state (var(--color-border) background, cursor not-allowed) per button hierarchy (UX Spec §7.2, §7.3)

**And** after field type's validation completes:
- Success: green checkmark appears with optional success message
- Failure: error message displays below field (from field type's validator)
- Submit button becomes enabled when all validations pass
- **UX Design:** Success shows var(--color-success) checkmark with var(--color-success-light) background, brief animation (var(--duration-slower) fade). Failure shows inline error with var(--color-error) styling. Submit button transitions to enabled state (var(--color-primary) primary button) (UX Spec §7.2, §7.3)

**And** if field type's validation times out or fails:
- Error message shows: "Validation failed. Please try again."
- User can retry by re-entering value or clicking retry icon
- Validation doesn't block indefinitely

**And** for card creation:
- Validation triggers on field blur (debounced 300ms)
- Re-validates all fields on form submit
- Shows which fields are currently validating
- Prevents submission until all validations complete successfully

**And** for status transitions:
- Validates all required fields when transition dialog opens
- Shows validation progress for multiple async fields
- Displays which fields are blocking transition
- Transition button enabled only when all validations pass

**Prerequisites:** Story 4.3

**Technical Notes:**
- Field types implement their own validation logic (sync or async)
- Field types return validation results: { valid: boolean, message?: string }
- UI components handle Promise-based validation responses
- Add loading states to field components
- Debounce validation triggers on blur (300ms)
- Handle multiple concurrent validations
- Clear validation state on field value change
- Note: Validation logic lives in field type implementations, not in UI layer
- **Design System:** Build `<ValidationBadge>` component with states: Valid (var(--color-badge-valid)), Invalid (var(--color-badge-invalid)), Pending (var(--color-badge-pending)), Not Validated (var(--color-badge-not-validated)) (UX Spec §6.5). Use animation tokens for state transitions: var(--duration-slow) for debounce, var(--duration-slower) for success fade (UX Spec §6.2)

---

## Story 4.5: Conditional and Cross-Field Validation

**UX Design Reference:** See UX Design Spec: Section 5.4 - Conditional Field Display, Section 6.2 - Animation Tokens, Section 7.3 - Validation Patterns

As a project owner,
I want fields to be conditionally required or validated based on other field values,
So that I can enforce context-specific business rules.

**Acceptance Criteria:**

**Given** I am configuring field requirements
**When** I enable conditional logic for a field
**Then** I can define conditions based on other fields

**And** I can configure conditions like:
- "Priority is High or Critical" → "Steps to Reproduce" is required
- "Type is Bug" → "Severity" field becomes visible
- "Status is Done" → "Resolution" is required
- "Amount > 1000" → "Approval Code" is required

**And** condition builder provides:
- Field selector (choose field to check)
- Operator selector (equals, not equals, greater than, less than, contains, is empty)
- Value input (depends on field type)
- Multiple conditions with AND/OR logic

**And** conditional logic affects:
- Field visibility (show/hide)
- Field requirement (required/optional)
- Validation rules (enabled/disabled)

**And** for cross-field validation, I can enforce:
- "End Date must be after Start Date"
- "Actual Hours cannot exceed Estimated Hours"
- "If Priority is High, Assignee is required"

**And** conditions evaluate:
- In real-time as field values change
- Before status transitions
- On form load (for existing cards)

**And** users see:
- Fields appear/disappear based on conditions
- Required indicators (*) update dynamically
- Clear error messages for cross-field violations
- **UX Design:** Fields fade in/out with var(--duration-fast) transition. Required asterisks (*) appear in labels dynamically. Cross-field validation errors use same inline error pattern (var(--color-error)) with clear messaging (UX Spec §6.2, §7.3)

**And** conditional fields in status transitions:
- Only shown if condition is met
- Required only if condition is met
- Validation runs only if visible

**Prerequisites:** Story 4.4

**Technical Notes:**
- Create conditional logic engine with expression parser
- Support field references in conditions
- Implement AND/OR logic for complex conditions
- Store conditions in field config JSON
- Build visual condition builder UI
- Re-evaluate conditions on any field value change
- Optimize condition checking for performance
- Handle circular dependencies (prevent infinite loops)
- Create helper functions for common condition patterns
- **Design System:** Use fade transition animations (var(--duration-fast)) for field visibility changes. Required field indicators use subtle var(--color-error) left border (var(--spacing-xs), var(--color-error)) when empty and required (UX Spec §5.4 step 6, §6.2). Condition builder UI uses shadcn Select and Input components

---

## Story 4.6: Default Field Values

**UX Design Reference:** See UX Design Spec: Section 5.2 - Journey 1 (Card Transition), Section 6.2 - Typography Tokens

As a project owner,
I want to set default values for fields,
So that users have helpful starting points when creating cards.

**Acceptance Criteria:**

**Given** I am configuring any field type
**When** I navigate to the field settings
**Then** I can set a default value

**And** default values work for all field types:
- Text: template with variables like "Description:\n\nSteps to reproduce:\n1.\n2.\n3."
- Number: specific value (e.g., 0, 100)
- Date: "Today", "Tomorrow", or specific date
- Dropdown: pre-selected option
- Multi-Select: pre-selected options (multiple)
- User Assignment: "Current User" or specific user
- Rich Text: formatted template content

**And** default value templates support variables:
- {{user.name}} - Current user's name
- {{user.email}} - Current user's email
- {{date.today}} - Today's date
- {{project.name}} - Project name

**And** when user creates a new card:
- All fields with default values are pre-filled
- User can edit or clear default values
- Default values respect field type formatting
- Variables are resolved at card creation time
- **UX Design:** Pre-filled values appear immediately when card type is selected (UX Spec §5.2 step 4). Default values use same inline editing pattern, user can click to edit. Field shows with normal view mode styling, not distinguished from user-entered values

**And** when I update a default value:
- New cards use the new default
- Existing cards are not changed
- Preview shows resolved default value

**And** for dropdown/multi-select defaults:
- Dropdown: one option pre-selected
- Multi-Select: multiple options pre-selected
- Invalid defaults are ignored with warning

**Prerequisites:** Story 4.5

**Technical Notes:**
- Store default values in field config JSON
- Create template variable resolver
- Support different default types per field type
- Implement variable substitution on card creation
- Add default value preview in field configuration
- Validate default values against field type
- Create template editor with variable suggestions
- Cache resolved variables for performance
- **Design System:** Template editor shows variables with monospace font (var(--font-mono)) for technical values. Preview uses same field rendering as actual cards. Variable suggestions dropdown uses shadcn Popover component with search (UX Spec §5.2, §6.2)

---
