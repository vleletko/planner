# Epic 8: Comments & Activity Tracking

**Goal:** Provide collaboration capabilities through Markdown comments with @mentions and comprehensive activity history logging for audit trails and team communication.

**Design Token Usage:** All design values must use design tokens from the design system. See docs/ux-design-specification.md for token definitions.

## UX Design References

This epic implements the Comments and Activity features described in the UX Design Specification (Section 5.5 - Journey 4: View/Edit Card Detail).

**Design System:** shadcn/ui (New York style) + Tailwind CSS
**Color Theme:** Balanced Teal - Modern, Helpful, Balanced

**Key Design Patterns:**
- Inline editing with real-time preview for comments
- Markdown toolbar with formatting controls: **B** *I* `Code` > Quote - List • List [Link]
- @mention autocomplete with member dropdown
- Tabbed interface for Comments and Activity in card detail modal
- Activity timeline with visual indicators and color coding

**Visual Components:**
- Comment avatars: var(--spacing-xl) circles with initials (colored background)
- Activity avatars: var(--spacing-lg) circles
- Markdown rendered content with syntax highlighting for code blocks
- Relative timestamps ("2 hours ago") with absolute tooltip ("Jan 15, 2025 2:30 PM")

**Color Palette References:**
- Primary actions: var(--color-primary)
- Success states: var(--color-success)
- Warning states: var(--color-warning)
- Error states: var(--color-error)
- Text: var(--color-text)
- Secondary text: var(--color-text-secondary)

## Story 8.1: Card Comments with Markdown Support

**UX Design Spec:** See Section 5.5 - Journey 4: View/Edit Card Detail (Comments Tab)

As a user,
I want to add comments to cards with rich formatting,
So that I can communicate context and updates with my team.

**Acceptance Criteria:**

**Given** I am viewing a card detail view
**When** I scroll to the comments section
**Then** I see all existing comments and a comment input area

**And** comment input provides:
- Markdown editor with live preview
- Formatting toolbar (bold, italic, lists, links, code blocks)
  - **UX Design:** Toolbar buttons: **B** *I* `Code` > Quote - List • List [Link]
  - **Components:** Use shadcn/ui Button components with Lucide icons
  - **Styling:** var(--color-primary) for active/hover states
- "Add Comment" button
  - **UX Design:** Primary button (primary background, white text)
  - **Component:** shadcn/ui Button variant="default"
- Character count indicator
  - **Styling:** Small text var(--text-sm), var(--color-text-secondary)
- Auto-save draft to prevent data loss
  - **Behavior:** Save to localStorage on blur/input change

**And** Markdown support includes:
- Bold, italic, strikethrough
- Headings (h1-h6)
- Bulleted and numbered lists
- Code blocks with syntax highlighting
- Inline code
- Links (auto-detect URLs)
- Block quotes
- Tables (basic support)

**And** when I submit a comment:
- Comment appears immediately in the list
  - **UX Design:** Optimistic UI with slight gray overlay (opacity: 0.6)
  - **Animation:** Fade in (var(--duration-normal) transition)
  - **Behavior:** After save, gray overlay fades out
- Markdown is rendered with formatting
  - **Styling:** Use var(--font-sans), var(--text-base) body text
  - **Code blocks:** Syntax highlighting with var(--font-mono)
- Shows my avatar, name, and timestamp
  - **UX Design:** User avatar (var(--spacing-xl) circle with colored background and initials)
  - **Typography:** User name (var(--font-semibold), var(--color-text))
  - **Timestamp:** Relative time with absolute tooltip
- "Just now" relative time (updates to "5 minutes ago", etc.)
  - **Styling:** Small text var(--text-sm), var(--color-text-secondary)
  - **Tooltip:** Absolute timestamp on hover ("Jan 15, 2025 2:30 PM")

**And** comments list displays:
- All comments sorted newest first (or oldest first, user preference)
  - **UX Design:** Toggle control in Comments tab header
- Commenter avatar and name
  - **Avatar:** var(--spacing-xl) circle with colored background and initials
  - **Name:** var(--font-semibold), var(--color-text), adjacent to avatar
- Comment timestamp (relative)
  - **Display:** "2 hours ago" with absolute tooltip on hover
  - **Color:** var(--color-text-secondary)
- Rendered Markdown content
  - **Spacing:** var(--spacing-md) vertical spacing between comments
  - **Max-height:** Comments tab scrollable (max-height: 400px)
- Edit/Delete buttons (only on own comments)
  - **UX Design:** Actions appear on hover
  - **Icons:** Pencil icon (edit), Trash icon (delete) from Lucide
  - **Color:** var(--color-text-secondary) default, hover to var(--color-text)

**And** comment rendering:
- Links are clickable and open in new tab
- Code blocks have syntax highlighting
- Lists render properly
- Tables render properly
- Content sanitized to prevent XSS

**Prerequisites:** Story 7.5

**Technical Notes:**
- Create comments table (card_id, user_id, content_markdown, created_at, updated_at)
- Add ORPC mutations: createComment, updateComment, deleteComment
- Use Markdown library (react-markdown, marked)
- Use DOMPurify for XSS prevention
- Implement Markdown editor component with preview
  - **UX Component:** Textarea with markdown toolbar
  - **Toolbar buttons:** Bold, Italic, Code, Quote, Bullet List, Numbered List, Link
  - **Preview toggle:** "Preview" button to switch between edit/preview modes
  - **Component library:** shadcn/ui Button and Textarea components
- Add syntax highlighting for code blocks (e.g., highlight.js)
  - **Font:** var(--font-mono)
  - **Background:** var(--color-background-tertiary) for code blocks
- Store raw Markdown in database
- Render Markdown on display
- Auto-save drafts to localStorage
  - **Key format:** `comment-draft-{cardId}`
  - **Save trigger:** On blur or input change (debounced 500ms)
- **Styling constants:**
  - Avatar size: var(--spacing-xl)
  - Comment spacing: var(--spacing-md) vertical
  - Font: var(--font-sans), var(--text-base) for body
  - Colors: Use CSS variables from design tokens

---

## Story 8.2: @Mentions in Comments

**UX Design Spec:** See Section 5.5 - Journey 4: View/Edit Card Detail (Comments Tab - @Mentions)

As a user,
I want to @mention team members in comments,
So that I can notify them of important updates.

**Acceptance Criteria:**

**Given** I am writing a comment
**When** I type "@" followed by a character
**Then** I see a dropdown of project members to mention

**And** @mention autocomplete provides:
- Dropdown appears immediately on typing "@"
  - **UX Design:** Popover component from shadcn/ui
  - **Position:** Below cursor position or above if insufficient space
  - **Animation:** Fade in (var(--duration-fast) transition)
- Filters members as I continue typing
  - **Debounce:** 200ms for filter updates
  - **Search:** Match against name and username
- Shows member avatar, name, and username
  - **Avatar:** var(--spacing-lg) circle with colored background and initials
  - **Name:** Primary text (var(--color-text), var(--font-semibold))
  - **Username:** Secondary text (@username, var(--color-text-secondary))
  - **Layout:** Horizontal flex with var(--spacing-sm) gap
- Navigate with arrow keys
  - **Keyboard:** Up/Down arrows to navigate, highlight selection
  - **Styling:** Selected item with var(--color-primary-light) background
- Select with Enter or click
  - **Behavior:** Insert @username at cursor position
  - **Highlight:** Mention text in var(--color-primary-hover) color
- Cancel with Escape
  - **Behavior:** Close dropdown, return focus to textarea

**And** when I select a member to mention:
- Username inserted into comment as: @username
- Mention highlighted in editor
- Can mention multiple members in one comment

**And** rendered mentions display:
- Highlighted/colored differently from regular text
  - **Color:** var(--color-primary-hover) text color
  - **Background:** var(--color-primary-light) subtle background
  - **Font weight:** var(--font-semibold)
- Clickable (opens user profile or card filter by user)
  - **Component:** Link-style behavior with hover underline
  - **Hover state:** Background darkens to var(--color-hover)
- Shows full name on hover
  - **Tooltip:** shadcn/ui Tooltip component
  - **Content:** Full name and role (if applicable)
- Mentions work in all Markdown contexts (lists, quotes, etc.)
  - **Implementation:** Custom markdown renderer for @username pattern

**And** mention notifications:
- Mentioned users are notified (depends on notification system)
- Mention is tracked in database
- Can query cards/comments where user was mentioned

**And** mention validation:
- Only current project members can be mentioned
- Mentions of users who left project show as plain text
- Invalid mentions (typos) render as plain text

**Prerequisites:** Story 8.1

**Technical Notes:**
- Create comment_mentions table (comment_id, user_id)
- Parse mentions from comment content on save
- Store mentions separately for querying
- Implement mention autocomplete component
- Use mention plugin for Markdown editor
- Render mentions as special elements with click handlers
- Query project members for autocomplete
- Debounce autocomplete queries (200ms)
- Handle mention deletion when user leaves project

---

## Story 8.3: Edit and Delete Comments

**UX Design Spec:** See Section 5.5 - Journey 4: View/Edit Card Detail (Comments Tab - Edit/Delete)

As a user,
I want to edit or delete my own comments,
So that I can correct mistakes or remove outdated information.

**Acceptance Criteria:**

**Given** I have posted a comment
**When** I view my comment
**Then** I see "Edit" and "Delete" buttons

**And** when I click "Edit":
- Comment switches to edit mode
  - **Animation:** Smooth transition (var(--duration-fast))
  - **Component:** Same Markdown editor as comment creation
- Markdown editor appears with current content
  - **Toolbar:** Same formatting buttons: **B** *I* `Code` > Quote - List • List [Link]
  - **Preview:** Toggle between edit and preview modes
- "Save" and "Cancel" buttons appear
  - **Save button:** Primary (var(--color-primary) background, white text)
  - **Cancel button:** Secondary (var(--color-text-secondary) text, transparent background)
  - **Layout:** Horizontal flex, var(--spacing-sm) gap, below textarea
- Original comment remains visible until saved
  - **Behavior:** Editor replaces comment display during edit

**And** when editing a comment:
- I can modify the Markdown content
- Preview updates in real-time
- @mentions autocomplete still works
- Can cancel to discard changes

**And** when I save edited comment:
- Comment updates with new content
  - **Animation:** Fade transition (var(--duration-normal))
  - **Behavior:** Editor switches back to view mode
- "Edited" indicator appears with timestamp
  - **Display:** "(edited)" badge next to timestamp
  - **Styling:** Small text var(--text-xs), var(--color-text-muted), italic
  - **Position:** After relative timestamp
- Hover shows "Edited [timestamp]"
  - **Tooltip:** shadcn/ui Tooltip component
  - **Content:** Absolute timestamp of edit ("Edited Jan 15, 2025 3:45 PM")
- Original content is not preserved (no edit history)
  - **Database:** Update content_markdown and edited_at fields

**And** when I click "Delete":
- Confirmation dialog appears: "Delete this comment?"
  - **Component:** shadcn/ui AlertDialog component
  - **Title:** "Delete this comment?"
  - **Description:** "This action cannot be undone."
  - **Buttons:** "Delete" (destructive, var(--color-error)) and "Cancel" (secondary, var(--color-text-secondary))
- On confirm, comment is permanently removed
  - **Animation:** Fade out (var(--duration-normal)) before removal
  - **Behavior:** Remove from DOM after animation completes
- Comment disappears from list immediately
  - **Update:** Decrement comment count badge in Comments tab
- No "deleted" placeholder shown
  - **Implementation:** Hard delete from UI (database can use soft delete)

**And** permissions:
- Only comment author can edit/delete their own comments
- Project owners/admins cannot edit others' comments
- Project owners/admins CAN delete any comment (moderation)
- Deleted comments remove mentions and notifications

**And** edge cases:
- Cannot edit/delete if user is no longer project member
- If comment is edited, mentions are re-parsed
- New mentions trigger notifications
- Removed mentions don't trigger un-notifications

**Prerequisites:** Story 8.2

**Technical Notes:**
- Add ORPC mutations: updateComment, deleteComment
- Check user permissions before edit/delete
- Add edited_at timestamp field to comments
- Re-parse mentions on comment update
- Add "edited" indicator in UI
  - **Display:** "(edited)" text with var(--text-xs) size, var(--color-text-muted)
  - **Tooltip:** Show absolute edit timestamp on hover
- Soft delete vs hard delete consideration
  - **UI:** Remove comment immediately from display
  - **Database:** Can implement soft delete for audit trails
- Update activity log when comment edited/deleted
  - **Activity entry:** "User edited a comment" or "User deleted a comment"
- Handle optimistic updates with rollback on error
  - **Edit:** Show updated comment immediately, revert on error
  - **Delete:** Fade out comment, restore if error occurs
- **Animation timings:**
  - Edit mode transition: var(--duration-fast)
  - Save/Cancel transition: var(--duration-normal)
  - Delete fade out: var(--duration-normal)
- **Component reuse:** Use same MarkdownEditor component for create and edit

---

## Story 8.4: Activity History Logging

**UX Design Spec:** See Section 5.5 - Journey 4: View/Edit Card Detail (Activity Tab)

As a user,
I want to see all changes made to a card,
So that I have a complete audit trail of work item history.

**Acceptance Criteria:**

**Given** a card exists
**When** I view the card's activity tab
**Then** I see a chronological log of all changes

**And** activity log captures:
- Card creation (who created, when)
- Status transitions (from → to status, who, when)
- Field value changes (old value → new value, who, when)
- Assignee changes (assigned to/unassigned, who, when)
- Comments added/edited/deleted (who, when)
- Card type changes (if supported)
- File attachments added/removed

**And** activity entries display:
- User avatar and name
  - **Avatar:** var(--spacing-lg) circle with colored background and initials (smaller than comment avatars)
  - **Name:** var(--font-semibold), var(--color-text)
  - **System actions:** Use system icon instead of avatar
- Action description (auto-generated)
  - **Format:** "[User] [action] [details]" (e.g., "Anna M. changed Priority from High to Medium")
  - **Styling:** Body text var(--text-base), var(--color-text)
  - **Highlight:** Field names and values in var(--font-semibold)
- Timestamp (relative and absolute)
  - **Display:** Relative time ("2 hours ago")
  - **Tooltip:** Absolute timestamp on hover ("Jan 15, 2025 2:30 PM")
  - **Color:** var(--color-text-secondary)
- Old and new values for changes
  - **Old value:** Strikethrough, var(--color-text-muted)
  - **New value:** Regular weight, var(--color-text)
  - **Separator:** "→" or "from/to" format
- Sorted newest first (reverse chronological)
  - **Layout:** Vertical list with consistent spacing (var(--spacing-sm) + var(--spacing-xs) between entries)

**And** activity entry format:
- "Alice moved this card from Backlog to In Progress - 2 hours ago"
  - **Status names:** Display with colored badges (status color backgrounds)
  - **Component:** Use same status badge component as card display
- "Bob updated Priority from Medium to High - yesterday"
  - **Old value:** Strikethrough styling, var(--color-text-muted)
  - **New value:** var(--font-semibold) styling
- "Carol added comment - 3 days ago"
  - **Link:** Click to scroll to comment in Comments tab
  - **Icon:** Comment icon from Lucide
- "Dave assigned this to Alice - Jan 15, 2025"
  - **Assignee:** Show user avatar (var(--spacing-md)) + name
- "Eve created this card - Jan 10, 2025"
  - **Icon:** Plus icon or creation icon
  - **Position:** Last entry (oldest)

**And** for field value changes:
- Show old value → new value
- Format values appropriately (dates, numbers, dropdowns)
- Truncate long text values (show "..." with expand)
- Show resource changes (resource name, not ID)

**And** activity filtering:
- "Show all activity" (default)
  - **Component:** shadcn/ui Select dropdown
  - **Position:** Above activity feed, right-aligned
- "Show only status changes"
  - **Icon:** Status change icon (arrows/workflow icon)
- "Show only field updates"
  - **Icon:** Edit icon (pencil)
- "Show only comments"
  - **Icon:** Comment bubble icon
- Filter by user (who made changes)
  - **Component:** User selector dropdown with avatars
  - **Search:** Filter members by name
  - **Layout:** Multi-select to filter by multiple users
- **Clear filter button:** "Clear All" link (var(--color-text-secondary) text) when filters active
- **Active state:** Selected filter shows count badge "(12)"

**And** activity performance:
- Load recent 50 entries by default
  - **Loading state:** Skeleton loader with shimmer effect
  - **Component:** shadcn/ui Skeleton component
- "Load more" button for older entries
  - **Position:** Bottom of activity feed
  - **Button:** Secondary style (var(--color-text-secondary) text, outline)
  - **Loading state:** Button shows spinner while loading
- Infinite scroll or pagination
  - **Recommended:** "Load more" button for better control
  - **Alternative:** Infinite scroll with intersection observer
- Fast query performance
  - **Target:** <500ms for activity feed load
  - **Optimization:** Index on card_id and created_at

**Prerequisites:** Story 8.3

**Technical Notes:**
- Create activities table (card_id, user_id, action_type, old_value, new_value, metadata_json, created_at)
- Log activities on all card mutations
- Use database triggers or application-level logging
- Store structured data in metadata_json for complex changes
- Query activities with user joins for display
- Format activity messages in UI layer
  - **Template:** Create activity message templates for each action_type
  - **Styling:** Use React components to render formatted text with proper colors and styles
- Add indexes on card_id and created_at
- Consider activity retention policy (archive old entries)
- Generate human-readable descriptions from activity data
- **UX Component architecture:**
  - ActivityFeed component (container)
  - ActivityEntry component (individual entry with avatar, description, timestamp)
  - ActivityFilter component (dropdown for filtering)
  - ActivityLoadMore component (pagination button)
- **Styling constants:**
  - Activity avatar size: var(--spacing-lg)
  - Entry spacing: var(--spacing-sm) + var(--spacing-xs) vertical
  - Font: var(--font-sans), var(--text-base) for body
  - Old value color: var(--color-text-muted) with strikethrough
  - New value color: var(--color-text) with var(--font-semibold)
  - Timestamp color: var(--color-text-secondary)

---

## Story 8.5: Activity Timeline View

**UX Design Spec:** See Section 5.5 - Journey 4: View/Edit Card Detail (Activity Tab - Timeline View)

As a user,
I want a visual timeline of card activity,
So that I can quickly understand the card's history at a glance.

**Acceptance Criteria:**

**Given** I am viewing a card's activity
**When** I switch to timeline view
**Then** I see a visual timeline of all activities

**And** timeline visualization includes:
- Vertical timeline with date markers
  - **Layout:** Left-aligned vertical line (2px width, var(--color-border))
  - **Nodes:** Circular markers (var(--spacing-sm)) at each activity point
  - **Line height:** Connects all activities in chronological order
- Activity grouped by date (Today, Yesterday, Jan 15, etc.)
  - **Date headers:** Sticky headers with bold text (var(--color-text), var(--font-semibold))
  - **Spacing:** var(--spacing-lg) between date groups
  - **Background:** Subtle background (var(--color-background-tertiary)) for date headers
- Icons for different activity types (status change, edit, comment, etc.)
  - **Size:** var(--spacing-md) icons from Lucide icon library
  - **Position:** Inside circular markers on timeline
  - **Colors:** Match activity type (status colors for transitions)
- Color coding (status transitions use status colors)
  - **Status changes:** Use target status color for marker
  - **Comments:** var(--color-primary) (primary color)
  - **Field updates:** var(--color-secondary) (secondary)
  - **Assignments:** var(--color-info)
  - **Attachments:** var(--color-info)
- Connecting lines between activities
  - **Line:** Vertical 2px solid line, var(--color-border)
  - **Connection:** From one marker to next marker

**And** timeline groups activities by:
- Today
- Yesterday
- This week (grouped by day)
- Earlier (grouped by week or month)

**And** activity type icons:
- 🔄 Status transitions
  - **Icon:** ArrowRightLeft or Workflow icon from Lucide
  - **Color:** Status color (varies by target status)
- ✏️ Field updates
  - **Icon:** Edit or Pencil icon from Lucide
  - **Color:** var(--color-secondary)
- 💬 Comments
  - **Icon:** MessageSquare or MessageCircle icon from Lucide
  - **Color:** var(--color-primary)
- 👤 Assignee changes
  - **Icon:** UserPlus or UserCheck icon from Lucide
  - **Color:** var(--color-info)
- 📎 Attachments
  - **Icon:** Paperclip or File icon from Lucide
  - **Color:** var(--color-info)
- ⚙️ Card configuration changes
  - **Icon:** Settings or Cog icon from Lucide
  - **Color:** var(--color-secondary)

**And** timeline interactions:
- Hover on activity for full details
  - **Hover state:** Background changes to var(--color-hover)
  - **Tooltip:** shadcn/ui Tooltip showing full details (if truncated)
  - **Cursor:** Pointer to indicate interactivity
- Click activity to expand details
  - **Expandable:** Show full old/new values for complex changes
  - **Animation:** Smooth expand/collapse (var(--duration-normal) transition)
  - **Icon:** ChevronDown/ChevronUp to indicate expand state
- Click user avatar to filter by that user
  - **Behavior:** Apply user filter to activity feed
  - **Visual feedback:** Avatar border highlights (var(--color-primary))
- Click status to filter status transitions
  - **Behavior:** Filter to show only status changes
  - **Visual feedback:** Status badge border highlights
- Smooth scrolling through timeline
  - **Implementation:** CSS scroll-behavior: smooth
  - **Performance:** Virtualize for long timelines (>100 entries)

**And** timeline view options:
- Toggle between list and timeline view
  - **Component:** Toggle buttons (List icon / Timeline icon)
  - **Position:** Top-right of Activity tab header
  - **Active state:** var(--color-primary) background, white icon
  - **Inactive state:** var(--color-hover) background, var(--color-text-secondary) icon
- Expand/collapse date groups
  - **Control:** Click date header to collapse/expand group
  - **Icon:** ChevronDown/ChevronRight next to date
  - **Animation:** Smooth collapse (var(--duration-normal) transition)
  - **State persistence:** Remember expanded/collapsed state
- Show/hide specific activity types
  - **Component:** Multi-select checkboxes in filter dropdown
  - **Options:** Status, Fields, Comments, Assignments, Attachments
  - **Visual feedback:** Unchecked types are hidden from timeline
- Search within activity history
  - **Component:** Search input with magnifying glass icon
  - **Position:** Top of Activity tab, below view toggle
  - **Behavior:** Filter activities by text match (user, field, value)
  - **Debounce:** 300ms for search input

**And** timeline performance:
- Virtualize timeline for long histories
  - **Library:** Consider react-window or react-virtuoso
  - **Threshold:** Virtualize when >100 activities
  - **Benefit:** Maintain 60fps scrolling even with 1000+ entries
- Lazy load activities as user scrolls
  - **Implementation:** Intersection observer for load more trigger
  - **Batch size:** Load 50 activities per batch
  - **Loading indicator:** Skeleton loader at bottom during fetch
- Smooth animations and transitions
  - **Expand/collapse:** var(--duration-normal) var(--ease-in-out)
  - **Filter changes:** var(--duration-fast) fade transition
  - **Scroll:** CSS scroll-behavior: smooth
  - **Target FPS:** 60fps for all interactions

**Prerequisites:** Story 8.4

**Technical Notes:**
- Create timeline component with vertical layout
  - **Component structure:**
    - TimelineContainer (wrapper with scrollable area)
    - TimelineDateGroup (date header + activities)
    - TimelineActivity (individual activity with marker + content)
    - TimelineMarker (circular node with icon)
    - TimelineLine (vertical connecting line)
- Group activities by date ranges
  - **Logic:** Group by Today, Yesterday, This Week (by day), Earlier (by week/month)
  - **Date formatting:** Use relative dates with fallback to absolute
- Implement activity type icon mapping
  - **Map:** action_type → Lucide icon component
  - **Colors:** action_type → semantic color (status color, teal, gray, blue, purple)
- Add expand/collapse functionality
  - **State:** Track expanded date groups in component state
  - **Persistence:** Save to localStorage: `timeline-collapsed-groups-{cardId}`
- Use virtualization for long timelines
  - **Library:** react-window or react-virtuoso for >100 activities
  - **Implementation:** Virtual scroll with dynamic row heights
- Implement smooth scrolling animations
  - **CSS:** scroll-behavior: smooth on timeline container
  - **Transitions:** Use Tailwind transition utilities (transition-all duration-200)
- Cache activity data to avoid re-fetching
  - **Strategy:** Cache activities in React Query or SWR
  - **Invalidation:** Invalidate on new activity, comment, or field update
- Consider using timeline library (e.g., react-chrono)
  - **Evaluation:** May be overkill, custom component likely more flexible
  - **Recommendation:** Build custom timeline for better control over styling
- Optimize rendering for large activity histories
  - **Memo:** Memoize TimelineActivity components to prevent re-renders
  - **Virtual scrolling:** Essential for 100+ activities
  - **Lazy images:** Lazy load user avatars if many unique users
- **UX Component architecture:**
  - Timeline (main container with toggle)
  - TimelineView (timeline visualization)
  - ListView (flat list view, reuses ActivityFeed)
  - TimelineDateGroup (collapsible date section)
  - TimelineActivity (marker + icon + description)
  - TimelineSearch (search input for filtering)
- **Styling constants:**
  - Timeline line width: 2px
  - Timeline line color: var(--color-border)
  - Marker size: var(--spacing-sm) (node), var(--spacing-md) (with padding for icon)
  - Icon size: var(--spacing-md) (Lucide icons)
  - Date header background: var(--color-background-tertiary)
  - Date group spacing: var(--spacing-lg)
  - Activity spacing: var(--spacing-sm) + var(--spacing-xs) vertical

---
