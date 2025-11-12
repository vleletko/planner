# Epic 9: Telegram Notifications

**Goal:** Keep users informed of card assignments and status changes via Telegram bot integration, reducing the need for constant app checking and improving team responsiveness.

**Design System Reference:** This epic uses shadcn/ui components with Balanced Teal theme. All UI elements follow the inline editing pattern and form validation guidelines from the UX Design Specification.

**Important:** All design values must use design tokens from the design system. See docs/ux-design-specification.md for token definitions.

## Story 9.1: Telegram Bot Setup and Configuration

As a system administrator,
I want to set up a Telegram bot for the application,
So that users can receive notifications via Telegram.

**Acceptance Criteria:**

**Given** I am setting up the application
**When** I configure the Telegram bot
**Then** the system can send messages to users via Telegram

**And** bot setup includes:
- Create Telegram bot via BotFather
- Obtain bot token
- Configure bot token in environment variables
- Bot is active and responsive

**And** bot configuration in admin settings:
- Bot token field (masked password input with "Show" toggle, using shadcn/ui Input component)
- Test connection button (primary button, var(--color-primary) background per design system)
- Bot username display (body text, var(--color-text))
- Bot status indicator badge (var(--color-success) for active, var(--color-secondary) for inactive)

**And** when admin clicks "Test Connection":
- Button shows loading state (spinner, disabled)
- System sends test message to admin's Telegram
- Shows toast notification with success (var(--color-success)) or error (var(--color-error)) message
- Validates bot token is correct

**And** bot capabilities:
- Receive commands from users
- Send notification messages
- Handle user linking workflow
- Gracefully handle blocked users

**Prerequisites:** Story 8.5

**Technical Notes:**
- Use Telegram Bot API
- Store bot token in environment variables (never in database)
- Create Telegram service module
- Implement bot webhook or polling
- Add admin settings page for bot configuration
- Test bot connectivity on app startup
- Log bot errors for debugging
- Handle rate limiting from Telegram API
- Consider using telegram bot library (node-telegram-bot-api, telegraf)

**UX/Design Notes:**

**See UX Design Spec: Section 6.2 - Design Tokens**

- Use shadcn/ui Form components with validation
- Follow inline editing pattern for settings fields (see Section 5.1)
- Bot token field uses password input with masked display
- Status indicators use semantic colors (var(--color-success) / var(--color-secondary))
- Toast notifications for feedback (see Section 3.1)
- Primary button styling: var(--color-primary) background, white text, var(--radius-sm) border radius

---

## Story 9.2: User Account Linking

As a user,
I want to link my Telegram account to my Planner account,
So that I can receive notifications on Telegram.

**Acceptance Criteria:**

**Given** the Telegram bot is configured
**When** I want to link my Telegram account
**Then** I can connect my accounts via bot command or web interface

**And** linking via Telegram bot:
- User sends `/start` or `/link` command to bot
- Bot generates unique linking code
- Bot replies with: "Go to Planner settings and enter code: ABC123"
- Code expires after 10 minutes

**And** linking via web interface:
- Navigate to user settings → Notifications
- Click "Link Telegram Account" button (primary button, var(--color-primary))
- See linking code displayed in monospace font (var(--font-mono), var(--text-xl), emphasized)
- Instructions displayed in body text (var(--text-base), var(--color-text))
- Code displayed with copy-to-clipboard button (outline button)
- Instructions: "Send /start to @PlannerBot and enter this code"
- Alternative: "Or send this code to the bot: ABC123"

**And** completing the link:
- User enters code in bot or web interface
- System validates code with loading spinner
- Telegram chat_id is stored for user
- Success toast notification appears (var(--color-success-light) background)
- Success message appears in both Telegram and web
- Linked status shows in settings with green checkmark badge

**And** linked account displays:
- "Linked to @username" in settings (body text with var(--color-success) checkmark icon)
- Telegram username in body text (var(--text-base), var(--color-text))
- "Unlink Account" button (secondary button, var(--color-secondary) background)
- Last notification sent timestamp (small text, var(--text-sm), var(--color-text-secondary))

**And** unlinking account:
- Click "Unlink Account" button
- Confirmation dialog appears (shadcn/ui Dialog with overlay)
- Dialog header: "Stop receiving Telegram notifications?"
- Dialog actions: "Unlink" (destructive button, var(--color-error)) and "Cancel" (secondary, var(--color-secondary))
- On confirm: chat_id removed, link broken, success toast shown
- Can re-link anytime

**Prerequisites:** Story 9.1

**Technical Notes:**
- Create user_telegram table (user_id, chat_id, telegram_username, linked_at)
- Generate secure random linking codes
- Store codes temporarily (Redis or database with TTL)
- Bot command handlers for /start, /link
- Add linking UI to user settings
- Validate linking codes on submission
- Store Telegram chat_id after successful link
- Handle case where user blocks bot
- Add webhook handler for bot commands

**UX/Design Notes:**

**See UX Design Spec: Section 6.2 - Design Tokens**

- Linking code displayed in monospace font (var(--font-mono), var(--text-xl)) for clarity
- Use shadcn/ui Dialog component for confirmation modals (var(--radius-md) border radius)
- Copy-to-clipboard button uses outline style (var(--color-primary) border/text)
- Success states use var(--color-success) color for checkmarks and backgrounds
- Destructive action (unlink) uses var(--color-error) for button
- Toast notifications for all success/error states
- Follow spacing system: var(--spacing-md) between form elements

---

## Story 9.3: Notification Trigger Configuration

As a project owner,
I want to configure which events trigger Telegram notifications,
So that users only receive relevant updates.

**Acceptance Criteria:**

**Given** I am a project owner
**When** I navigate to project settings → Notifications
**Then** I can configure notification triggers

**And** notification configuration includes:
- "Notify on card assignment" toggle (shadcn/ui Switch component with var(--color-primary) active state)
- "Notify on status transitions" toggle with status selector
- Multi-select dropdown for status selection (shadcn/ui Multi-select)
- Save button (primary, var(--color-primary)) - only enabled when changes made

**And** for card assignment notifications:
- Toggle on/off
- Notifies user when they are assigned to a card
- Applies to all card types

**And** for status transition notifications:
- Toggle on/off
- Multi-select: choose which statuses trigger notifications
- Example: notify when card moves to "Ready for Review" or "Done"
- Can select multiple statuses

**And** configuration UI shows:
- Clear labels for each trigger type (body text, var(--text-base), var(--color-text))
- Helper text below each toggle (small text, var(--text-sm), var(--color-text-secondary))
- Preview section showing notification format examples
- Status selectors displaying status badges with their configured colors
- "Test Notification" button (outline button, var(--color-primary) border)

**And** when I click "Test Notification":
- Button shows loading state (spinner icon)
- Sends test notification to my Telegram
- Shows preview of actual notification format
- Success toast appears: "Test notification sent" (var(--color-success))
- Error toast if failed: "Failed to send test notification" (var(--color-error))
- Confirms configuration is working

**And** default configuration:
- Assignment notifications: enabled
- Status notifications: disabled
- No statuses selected by default

**Prerequisites:** Story 9.2

**Technical Notes:**
- Create notification_config table (project_id, notify_on_assignment, notify_on_statuses)
- Store selected status IDs in JSON array
- Add notification settings UI in project settings
- Implement test notification function
- Query notification config when events occur
- Default config created with project
- Validate status IDs exist in project

**UX/Design Notes:**

**See UX Design Spec: Section 6.2 - Design Tokens**

- Use shadcn/ui Switch component for toggles with var(--color-primary) active state
- Multi-select dropdown uses shadcn/ui Select with checkboxes
- Follow inline editing pattern - no separate edit mode needed (see Section 5.1)
- Auto-save on toggle/selection change with "Saving..." indicator
- Status badges maintain their project-configured colors in selector
- Helper text uses var(--color-text-secondary) color, var(--text-sm) font size
- Preview section uses card-like container with var(--color-border) border, var(--radius-md) radius
- Toast notifications for test results and save confirmation

---

## Story 9.4: Send Notifications on Card Assignment

As a user,
I want to receive a Telegram notification when assigned to a card,
So that I'm immediately aware of new work items.

**Acceptance Criteria:**

**Given** I have linked my Telegram account
**When** someone assigns me to a card
**Then** I receive a Telegram notification

**And** notification includes:
- Card title
- Card type and key (e.g., "BUG-123")
- Project name
- Action: "You were assigned to this card"
- Link to card in Planner

**And** notification format:
```
📋 [Project Name]
You were assigned to BUG-123: Fix login error

View card: https://planner.app/p/123/card/456
```

**And** notification behavior:
- Sent within 10 seconds of assignment
- Only sent if project has assignment notifications enabled
- Only sent if user has linked Telegram
- Silent failure if user hasn't linked (no error to assigner)

**And** when user clicks link:
- Opens card detail view in browser
- Requires login if not authenticated
- Deeplink to specific card

**And** retry logic:
- Retry up to 3 times on network failure
- Exponential backoff (1s, 2s, 4s)
- Log failure after all retries exhausted
- Don't block assignment operation if notification fails

**And** edge cases:
- User unlinked Telegram: no notification sent
- User blocked bot: silent failure, log event
- Bot token invalid: log error, don't retry
- User assigned then unassigned quickly: only send assignment notification

**Prerequisites:** Story 9.3

**Technical Notes:**
- Implement notification sending on card assignment
- Check notification config before sending
- Query user's Telegram chat_id
- Use Telegram sendMessage API
- Format notification with Markdown
- Include inline keyboard with "View Card" button
- Implement retry logic with exponential backoff
- Handle Telegram API errors gracefully
- Log all notification attempts and results
- Consider using message queue for reliability
- Store notification history (optional)

**UX/Design Notes:**

**See UX Design Spec: Section 6.2 - Design Tokens**

- Notification format uses emoji for visual categorization (📋 for cards)
- Card ID displayed in monospace format (var(--font-mono)) for clarity
- Link uses Telegram inline keyboard button for better UX
- No in-app UI changes for this story (backend notification only)
- Error states logged but don't interrupt user workflow

---

## Story 9.5: Send Notifications on Status Transitions

As a user,
I want to receive Telegram notifications when cards transition to configured statuses,
So that I'm aware of important workflow milestones.

**Acceptance Criteria:**

**Given** I have linked my Telegram account
**When** a card I'm assigned to transitions to a configured status
**Then** I receive a Telegram notification

**And** notification includes:
- Card title
- Card type and key
- Project name
- Status transition: "moved from [Old Status] to [New Status]"
- Who moved it
- Link to card

**And** notification format:
```
📋 [Project Name]
Alice moved BUG-123: Fix login error
From: In Progress → Done

View card: https://planner.app/p/123/card/456
```

**And** notification triggers:
- Only sent if target status is in project's notification config
- Only sent to assigned user (if card has assignee)
- If no assignee: no notification sent
- Sent within 10 seconds of status change

**And** notification behavior:
- One notification per transition
- Not sent if user performed the transition themselves
- Sent even if user isn't actively viewing the board
- Silent failure if user hasn't linked Telegram

**And** when multiple users affected:
- If card has multiple assignees (if supported): notify all
- If user is mentioned in transition comment: notify mention targets too (future)

**And** retry and error handling:
- Same retry logic as assignment notifications
- Network failures: retry 3 times
- User blocked bot: silent failure
- Log all notification events

**Prerequisites:** Story 9.4

**Technical Notes:**
- Implement notification sending on status transition
- Check if target status is in notification config
- Query assigned user's Telegram chat_id
- Don't notify if user is the one who moved the card
- Format notification with transition details
- Include user who performed action
- Use inline keyboard for "View Card" link
- Implement same retry logic as assignment notifications
- Handle multiple assignees (if supported)
- Log notification events for debugging
- Consider batching if many notifications at once

**UX/Design Notes:**

**See UX Design Spec: Section 6.2 - Design Tokens**

- Notification format shows clear transition arrow (→) for visual clarity
- User who performed action displayed for context
- Same emoji categorization as assignment notifications (📋)
- Telegram inline keyboard for "View Card" action
- No in-app UI changes for this story (backend notification only)

---

## Story 9.6: Notification Delivery Monitoring

As a project owner or admin,
I want to monitor notification delivery,
So that I can troubleshoot issues and ensure users receive updates.

**Acceptance Criteria:**

**Given** I am a project owner or admin
**When** I navigate to project settings → Notifications → Delivery Log
**Then** I see a log of all notification attempts

**And** delivery log shows (table layout):
- Timestamp (small text, var(--text-sm), var(--color-text-secondary))
- Notification type badge (assignment/status transition with distinct colors)
- Target user (with avatar, body text)
- Card title (truncated with tooltip on hover)
- Delivery status badge (var(--color-success) for sent, var(--color-error) for failed, var(--color-warning) for pending, var(--color-secondary) for not linked)
- Error message (if failed) - expandable row
- Retry count (small text)

**And** log filtering:
- Filter by date range (date picker component)
- Filter by user (dropdown with avatar + name)
- Filter by status (multi-select with colored badges)
- Filter by notification type (multi-select)
- Search by card title (search input with magnifying glass icon)
- "Clear Filters" button (secondary, var(--color-secondary))

**And** delivery statistics (card layout at top of page):
- Total notifications sent (last 7/30 days) - large number display
- Success rate percentage - with progress ring visualization (var(--color-success))
- Failed notifications count - with var(--color-error) accent
- Users with broken links (blocked bot) - with warning icon (var(--color-warning))

**And** notification health indicators (alert/banner style):
- Bot status badge: "Connected" (var(--color-success)) or "Disconnected" (var(--color-error))
- Recent failures: count with expandable list showing reasons
- Unlinked users: count with link to list view
- Users who blocked bot: count with var(--color-warning) warning indicator

**And** troubleshooting actions:
- "Resend Notification" button for failed notifications (outline button, per row action)
- "Test Bot Connection" button (outline button, var(--color-primary) border)
- Link to user settings for re-linking (text link with arrow icon)

**Prerequisites:** Story 9.5

**Technical Notes:**
- Create notification_log table (notification_type, user_id, card_id, status, error_message, sent_at)
- Log all notification attempts (success and failure)
- Add notification log UI in project settings
- Query and display log with pagination
- Calculate delivery statistics from log
- Add retry functionality for failed notifications
- Show user-friendly error messages
- Consider log retention policy (30-90 days)
- Add export functionality (CSV)

**UX/Design Notes:**

**See UX Design Spec: Section 6.2 - Design Tokens**

- Use shadcn/ui Table component for delivery log
- Statistics cards use shadcn/ui Card component with grid layout (2x2 or 4x1)
- Status badges use semantic colors consistently (var(--color-success) / var(--color-error) / var(--color-warning) / var(--color-secondary))
- Expandable rows for error details (click to expand with smooth animation)
- Filter controls in compact horizontal layout above table
- Pagination at bottom with shadcn/ui Pagination component
- Empty state: "No notifications found" with illustration
- Loading state: Skeleton loaders for table rows
- Success rate uses circular progress indicator
- Health indicators in alert-style banner (shadcn/ui Alert component)
- Tooltips on truncated text using shadcn/ui Tooltip
- Date picker uses shadcn/ui Calendar component
- User avatars follow consistent sizing (var(--spacing-xl) in table, var(--spacing-lg) in filters)
- Monospace font (var(--font-mono)) for card IDs and timestamps
- Export button (secondary, var(--color-secondary)) in top-right corner

---
