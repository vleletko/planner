# Epic 7: Search, Filters & Board Performance

**Goal:** Enable users to find cards quickly through real-time search and filtering, with performance optimizations to support 1000+ cards while maintaining smooth 60fps interactions.

**Design System Note:** All design values must use design tokens from the design system. See [UX Design Specification - Section 6.2 Design Tokens](../ux-design-specification.md#62-design-tokens) for token definitions.

**UX Design Reference:** See [UX Design Specification](../ux-design-specification.md)
- Section 4.1: Application Frame (Header Toolbar, Filter Bar)
- Section 3.1: Color System (Teal primary, semantic colors)
- Section 6.2: Design Tokens (Color, Typography, Spacing, Border Radius, Shadows)
- Section 7.2: Button Hierarchy
- Section 7.7: Empty State Patterns
- Section 6.3: shadcn/ui Component Library

## Story 7.1: Real-Time Card Search

**UX Design Reference:** See UX Design Spec Section 4.1 - Application Frame (Header Toolbar with Search)

As a user,
I want to search for cards by title and field values,
So that I can quickly find specific work items.

**Acceptance Criteria:**

**Given** I am viewing the board
**When** I type in the search bar
**Then** I see matching cards highlighted or filtered in real-time

**And** search functionality includes:
- Search bar prominently placed in header toolbar (UX Design: Section 4.1 - Application Frame)
- Search by card title (primary)
- Search by field values (text fields, rich text)
- Search by card key (e.g., "BUG-123")
- Real-time results as user types (debounced 300ms)
- **Design:** Use shadcn/ui Input component with search icon (Lucide)

**And** search behavior:
- Case-insensitive matching
- Partial match support (finds "auth" in "authentication")
- Highlights matching text in results (use `var(--color-primary-light)` background highlight)
- Shows match count: "Found 5 cards" (use `var(--color-text-secondary)`)
- Clear search button (X icon, appears on hover/focus)
- **Design:** Match count displays in `var(--color-text-secondary)`, clear button uses Outline Button pattern (Section 7.2)

**And** search results display:
- Option 1: Filter mode - hide non-matching cards, show only matches
- Option 2: Highlight mode - dim non-matching cards (`opacity: var(--overlay-opacity)`), highlight matches (`var(--color-primary-light)` background)
- User can toggle between filter/highlight modes (Toggle component from shadcn/ui)
- Empty state if no matches found (Section 7.7: "No cards match your search")
- **Design:** Empty state shows centered message with search icon, "Try a different search term", [Clear Search] button (Secondary Button)

**And** search performance:
- Results appear within 300ms of typing
- Smooth performance with 1000+ cards
- No UI blocking during search
- Debounced input to avoid excessive queries

**And** when search is active:
- "Clear" button visible to reset search (Outline Button with X icon)
- Match count displayed in header next to search bar
- Can still interact with cards normally
- Can drag/drop filtered cards (maintain 60fps performance target)
- **Design:** Active search state indicated by `var(--color-primary)` border on search input

**Prerequisites:** Story 6.6

**Technical Notes:**
- Implement client-side search for speed (cards already loaded)
- Use fuzzy matching library (e.g., fuse.js) for better results
- Index card data for fast searching
- Debounce search input (300ms)
- Search across title, key, and text field values
- Highlight matching text in results
- Consider search query language for advanced searches (future)
- Store search state in URL query params for shareable links

**Design Implementation Notes:**
- Search input: shadcn/ui Input component with Lucide Search icon
- Clear button: shadcn/ui Button (variant: outline, size: icon)
- Empty state: Custom component following Section 7.7 pattern
- Highlight color: Use design token `var(--color-primary-light)` for matching cards
- Performance: Maintain 60fps during search filtering (Section 2.1)

---

## Story 7.2: Card Filtering by Type and Assignee

**UX Design Reference:** See UX Design Spec Section 4.1 - Application Frame (Filter Bar), Section 6.5 - Avatar Component

As a user,
I want to filter cards by card type and assignee,
So that I can focus on specific categories of work.

**Acceptance Criteria:**

**Given** I am viewing the board
**When** I open the filter panel
**Then** I see filter options for card type and assignee

**And** filter panel includes:
- Card type multi-select (checkboxes with icons and colors)
- Assignee multi-select (with avatars - see Section 6.5 for Avatar component)
- "Unassigned" option for cards without assignee
- "Apply Filters" button (Primary Button - Section 7.2)
- "Clear All" button (Secondary Button - Section 7.2)
- **Design:** Filter bar positioned below header toolbar (Section 4.1), uses shadcn/ui Popover/Dropdown for filter panel

**And** when I select filters:
- Multiple card types can be selected (OR logic)
- Multiple assignees can be selected (OR logic)
- Filters apply immediately or on "Apply" click (configurable)
- Filter count badge shows on filter button (e.g., "Filters (3)")
- **Design:** Active filters use `var(--color-primary)` background badge (Section 7.8), filter button shows Badge component with count

**And** filtered view shows:
- Only cards matching selected filters
- Card count per column updates
- "X filters active" indicator (displayed in filter bar with `var(--color-primary)` text)
- Click indicator to open filter panel
- **Design:** Active filter chips display in filter bar with `var(--color-primary)` background, white text, X icon to remove individual filters
- Empty state if no matches: "No cards match your filters" (Section 7.7)

**And** combining filters:
- Card type AND assignee filters work together (AND logic)
- Example: "Bug" cards assigned to "Alice"
- Search and filters work together
- Clear indication of active filters

**And** filter persistence:
- Filters persist during session
- Filters stored in URL query params
- Shareable filtered board URLs
- Reset on explicit "Clear All"

**Prerequisites:** Story 7.1

**Technical Notes:**
- Create filter panel component (dropdown or sidebar)
- Implement filter logic client-side for performance
- Store filter state in React state and URL
- Update URL when filters change
- Parse URL on page load to apply filters
- Combine search and filter results
- Optimize filtering for large datasets
- Add filter state to board query context

**Design Implementation Notes:**
- Filter panel: shadcn/ui Popover or DropdownMenu component
- Checkboxes: shadcn/ui Checkbox component
- Active filter chips: shadcn/ui Badge component with `var(--color-primary)` background
- Avatar display: shadcn/ui Avatar component
- Apply/Clear buttons: Follow Button Hierarchy (Section 7.2)
- Empty state: Follow Empty State Pattern (Section 7.7)
- Filter bar styling: Positioned below header, max-width 1280px container

---

## Story 7.3: Advanced Field-Based Filtering

**UX Design Reference:** See UX Design Spec Section 7.7 - Empty State Patterns, Section 6.3 - shadcn/ui Components (Select, Input)

As a user,
I want to filter cards by custom field values,
So that I can find cards with specific attributes.

**Acceptance Criteria:**

**Given** I am viewing the board
**When** I open advanced filters
**Then** I can filter by any card field

**And** advanced filter options include:
- Field selector (choose any field from any card type)
- Operator selector (based on field type)
- Value input (appropriate for field type)
- "Add Filter" to create multiple field filters (Outline Button - Section 7.2)
- Each filter can be removed individually (X icon button)
- **Design:** Advanced filter builder uses shadcn/ui Select for field/operator dropdowns, appropriate Input components for values

**And** for text fields, operators include:
- Contains
- Does not contain
- Equals
- Is empty / Is not empty

**And** for number fields, operators include:
- Equals
- Greater than
- Less than
- Between
- Is empty / Is not empty

**And** for date fields, operators include:
- Is (specific date)
- Before / After
- Between (date range)
- Is today / This week / This month
- Is empty / Is not empty

**And** for dropdown/multi-select fields:
- Is one of (select multiple options)
- Is not one of
- Is empty / Is not empty

**And** for user assignment fields:
- Is assigned to (user selector)
- Is unassigned
- Is assigned to me

**And** for resource reference fields:
- References resource (resource selector)
- Resource is valid / invalid
- Is empty / Is not empty

**And** multiple filters combine with AND logic:
- All conditions must match for card to appear
- Clear indication of how many filters active (Badge with count)
- Can remove individual filters (X icon on each filter chip)
- **Design:** Each active filter displays as a chip with `var(--color-hover)` background, `var(--color-text)` text, removable X icon
- Empty state: "No cards match your filters. Try adjusting your criteria." (Section 7.7)

**Prerequisites:** Story 7.2

**Technical Notes:**
- Create advanced filter builder UI
- Support filter operators per field type
- Implement filter evaluation logic
- Store filter state in URL (compressed)
- Handle filters for all field types
- Optimize filtering for large card counts
- Consider using query builder library
- Add filter presets/saved filters (future enhancement)

**Design Implementation Notes:**
- Filter builder: Custom component using shadcn/ui Select, Input, Button components
- Date picker: shadcn/ui Calendar/DatePicker component
- Field/operator selectors: shadcn/ui Select component with search if >10 options
- Filter chips: shadcn/ui Badge component with custom styling (`var(--color-hover)` background)
- Add Filter button: Outline Button variant
- Remove filter: Icon Button with X (Lucide) icon
- Layout: Organized rows with clear visual hierarchy, `var(--spacing-md)` spacing between filter rows

---

## Story 7.4: Board Performance Optimization

**UX Design Reference:** See UX Design Spec Section 2.1 - Core Experience (60fps Target), Section 6.5 - Skeleton Components, Section 1.1 - Animation Libraries

As a developer,
I want the board to load and render efficiently,
So that users experience smooth performance with 1000+ cards.

**Acceptance Criteria:**

**Given** a project with 1000+ cards
**When** I load the board
**Then** the board renders in under 2 seconds

**And** performance optimizations include:
- Virtualized column rendering for tall lists
- Lazy loading of card details (load on expand)
- Efficient data fetching (single query with joins)
- Memoized card components (React.memo)
- Optimized re-renders (only changed cards update)

**And** drag-and-drop performance:
- Maintains 60fps during drag operations (UX Design: Section 2.1 - Core Experience)
- Smooth animations (anime.js for card tilt, elevation transitions - Section 1.1)
- No jank or stuttering
- Fast drop response (<100ms)
- **Design:** Follow drag-and-drop interaction pattern (Section 4.1): card tilt, `var(--shadow-xl)` elevation, `var(--color-primary-light)` background during drag

**And** search/filter performance:
- Results appear within 300ms
- No blocking of UI during filtering
- Smooth transitions when applying filters
- Efficient re-indexing on data changes

**And** data loading strategy:
- Load all cards for project at once (if <5000 cards)
- Pagination for projects with 5000+ cards
- Incremental loading as user scrolls columns
- Cache loaded data in memory

**And** rendering optimizations:
- Use React.memo for card components
- Virtualize long columns (react-virtual) for boards with 100+ cards per column
- Batch state updates
- Avoid unnecessary re-renders
- Optimize image loading (lazy load attachments)
- **Design:** Use shadcn/ui Skeleton components for loading states (Section 6.5)

**And** performance metrics:
- Board load time <2s (measured)
- Time to interactive <3s
- Drag drop response <100ms
- Search results <300ms
- 60fps maintained during interactions

**Prerequisites:** Story 7.3

**Technical Notes:**
- Use react-virtual or similar for virtualization
- Implement efficient board data query (single query with all joins)
- Add database indexes on frequently queried fields
- Use React.memo and useMemo extensively
- Implement efficient drag-and-drop (avoid re-renders)
- Profile with React DevTools and Chrome DevTools
- Add performance monitoring (Web Vitals)
- Consider using React Server Components for data fetching
- Implement request deduplication
- Use optimistic updates to feel faster

**Design Implementation Notes:**
- Skeleton loaders: Use shadcn/ui Skeleton component for card/board loading states
- Animation library: anime.js for drag-and-drop animations (card tilt, elevation)
- Drag library: @dnd-kit (core + sortable) for accessible drag-and-drop
- Performance targets: 60fps during all interactions (Section 2.1)
- Loading states: `var(--color-hover)` background skeleton cards matching actual card dimensions
- Smooth transitions: Use tailwindcss-animate for state changes
- Follow design tokens for all colors, spacing, shadows (no hardcoded values)

---

## Story 7.5: Saved Filter Presets

**UX Design Reference:** See UX Design Spec Section 6.3 - shadcn/ui Components (DropdownMenu, Dialog), Section 7.2 - Button Hierarchy

As a user,
I want to save and reuse common filter combinations,
So that I can quickly switch between different board views.

**Acceptance Criteria:**

**Given** I have applied filters to the board
**When** I click "Save Filter Preset"
**Then** I can name and save the current filter configuration

**And** saved presets include:
- Preset name (user-defined)
- All active filters (search, card type, assignee, field filters)
- Private to user (not shared with project members)
- Quick access from filter dropdown
- **Design:** Preset selector in filter bar, uses star icon (Lucide) to indicate saved presets

**And** preset management:
- Create new preset from current filters
- List of all saved presets
- Apply preset with one click
- Edit preset (rename, update filters)
- Delete preset
- "Default" preset option (applies on board load)

**And** when I select a preset:
- All filters apply immediately
- Board updates to show filtered view
- Preset name shown in filter indicator
- Can modify filters after applying preset (doesn't update saved preset)

**And** preset UI includes:
- Preset selector dropdown (star icon or similar)
- List shows preset names
- Indicates which preset is active (if any) - uses `var(--color-primary)` background for active preset
- "Save current as new preset" option (Outline Button)
- "Update [preset name]" option if preset is active and modified
- **Design:** Dropdown uses shadcn/ui DropdownMenu, preset items show star icon for default, checkmark for active
- Save/edit preset dialog uses shadcn/ui Dialog with Input for name field

**And** default behaviors:
- Can set one preset as default
- Default preset applies on board load
- No preset applied if none set as default
- Reset to "no filters" option always available

**Prerequisites:** Story 7.4

**Technical Notes:**
- Create filter_presets table (user_id, project_id, name, filters_json, is_default)
- Add ORPC mutations: createPreset, updatePreset, deletePreset
- Store filter state as JSON
- Load presets on board mount
- Apply preset by restoring filter state
- Update URL when preset applied
- Create preset management UI
- Handle preset conflicts (deleted fields, etc.)

**Design Implementation Notes:**
- Preset selector: shadcn/ui DropdownMenu with Star icon (Lucide) trigger button
- Preset list: Each item shows preset name, star icon if default, checkmark if active
- Active preset: `var(--color-primary)` background on dropdown item
- Save preset dialog: shadcn/ui Dialog with Input component for preset name
- Buttons: "Save Preset" (Primary), "Cancel" (Secondary) per Section 7.2
- Edit/Delete preset: Context menu on preset items with Edit and Delete (destructive) options
- Default preset indicator: Filled star icon, non-default shows outline star
- Empty state (no presets): "No saved presets yet. Apply filters and save your first preset."

---
