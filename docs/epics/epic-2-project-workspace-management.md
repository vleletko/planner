# Epic 2: Project & Workspace Management

**Goal:** Enable users to create projects, invite team members, and manage role-based access control. This epic establishes the project-based workspace foundation where all workflow configuration and card management happens.

**UX Design References:**
- Design System: shadcn/ui (New York style) + Tailwind CSS
- Color Theme: Balanced Teal (primary: `var(--color-primary)`, hover: `var(--color-primary-hover)`)
- Key Components: Dialog system, Form validation patterns, Button hierarchy, Toast notifications
- Navigation: Header toolbar with project selector dropdown (Section 2.1)
- See: `/docs/ux-design-specification.md` sections 1.1, 3.1, 7.2-7.4, 7.9

**Design Token Usage:**
All design values must use design tokens from the design system. See docs/ux-design-specification.md Section 6.2 for complete token definitions.

## Story 2.0: Epic 2 UX Design

As a developer,
I want complete UX designs for all Epic 2 screens and flows,
So that implementation stories have clear visual specifications to follow.

**Acceptance Criteria:**

**Given** the Epic 2 functional requirements
**When** this story is complete
**Then** the following deliverables exist:

1. **Screen Wireframes/Mockups:**
   - Projects list page (empty state, populated state)
   - Project creation dialog
   - Project overview/dashboard page
   - Project settings page (Overview tab, Members tab)
   - Member invitation dialog
   - Ownership transfer dialog
   - Project deletion confirmation dialog

2. **User Flows:**
   - New user → create first project → land on project dashboard
   - Owner → invite member → member accepts
   - Owner → transfer ownership → confirmation → role change
   - Admin → delete project → confirmation → redirect

3. **Interaction Specifications:**
   - Form validation states (inline errors, field highlighting)
   - Loading states for async operations
   - Success/error feedback patterns
   - Dialog open/close animations
   - Empty states and onboarding cues

4. **Responsive Behavior:**
   - Desktop layout (primary)
   - Tablet/mobile adaptations (if applicable)

5. **Component Specifications:**
   - Project card component (for list view)
   - Member row component (for members table)
   - Role badge variants (Owner, Admin, Member)
   - Any new components not in existing design system

**Prerequisites:** Epic 1 complete, UX Design Specification exists

**Technical Notes:**
- Output format: Excalidraw wireframes and/or HTML mockups
- Store in `docs/ux-mockups/epic-2/`
- Reference existing design tokens from `docs/ux-design-specification.md`
- Designs should be detailed enough for dev implementation without ambiguity

---

## Story 2.1: Project Creation and Basic CRUD

As a user,
I want to create and manage my own projects,
So that I can organize my work into separate workspaces.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to the projects page
**Then** I see a list of my projects and a "Create Project" button

**And** when I click "Create Project", I see a form with:
- Project name field (required)
- Description field (optional)

**And** when I submit the form with a valid name:
- Project is created with me as the owner
- I am redirected to the project dashboard
- Default statuses are created (Backlog, In Progress, Done)

**And** when I try to create a project with duplicate name:
- I see error: "Project name must be unique"

**And** I can edit my project:
- Change project name and description
- Changes save successfully

**And** I can view project details:
- Project name, description
- Created date
- Owner information
- Member count

**Prerequisites:** Story 1.5 (Foundation complete)

**Technical Notes:**
- Create `projects` table in database schema
- Add ORPC router for project operations (create, read, update)
- Implement project list view and creation form
- Owner is set to current user on creation
- Unique constraint on project name per user
- Create default statuses in transaction with project creation

**UX Design Notes:**

**See UX Design Spec: Section 7.2 - Button Patterns, Section 7.3 - Toast Notifications, Section 7.4 - Form Validation**

- **Project Creation Dialog:**
  - Use shadcn/ui Dialog component (modal centered, 600px width)
  - Primary button: "Create Project" (background: `var(--color-primary)`, text: `var(--color-background)`)
  - Secondary button: "Cancel" (background: `var(--color-secondary)`)
  - Button placement: Right-aligned, primary on right (Section 7.2)
- **Form Fields:**
  - Name field: Required, min 3 characters, auto-focused on dialog open
  - Description field: Optional, textarea with resize handle
  - Validation: Inline error display with `var(--color-error)` border, error message below field (Section 7.4)
  - Success feedback: Toast notification "Project [Name] created" (background: `var(--color-success-light)`, duration: `var(--duration-slower)` + 2.5s auto-dismiss) (Section 7.3)
- **Project List View:**
  - Card layout for each project (background: `var(--color-background)`, border: `var(--color-border)`, radius: `var(--radius-md)`)
  - Display: Project name (weight: `var(--font-semibold)`), description (color: `var(--color-text-secondary)`), member count, created date
  - Empty state: "No projects yet. Create your first project to get started!" with "+ Create Project" button (Section 7.7)
- **Error Handling:**
  - Duplicate name error: Inline message "Project name must be unique" below name field
  - Network error: Toast notification with retry option (Section 7.3)

---

## Story 2.2: Project Access Control and Permissions

As a system,
I want to enforce role-based permissions on project operations,
So that only authorized users can perform sensitive actions.

**Acceptance Criteria:**

**Given** a project with defined roles (Owner, Admin, Member)
**When** a user attempts an operation
**Then** the system validates their permission level

**And** Project Owner can:
- Edit project settings (name, description)
- Invite users to project
- Transfer ownership to another member
- Delete project (with confirmation)
- All member permissions (create/edit/move cards, manage resources)

**And** Admin can:
- Access all projects system-wide
- Configure any project
- Invite users to any project
- Delete any project (with confirmation)
- All member permissions

**And** Project Member can:
- View project (read-only for settings)
- Create, edit, move cards
- Create and manage resources
- Cannot invite users or configure project

**And** unauthorized operations return:
- 403 Forbidden error
- Clear error message explaining required permission

**And** users only see projects they're members of in project list

**Prerequisites:** Story 2.1

**Technical Notes:**
- Create `project_members` join table (user_id, project_id, role)
- Add admin flag to users table (for system admins)
- Implement permission middleware in ORPC context
- Add helper functions: isOwner(), isAdmin(), isMember()
- Filter project queries by membership
- Document permission matrix in code comments

**UX Design Notes:**

**See UX Design Spec: Section 7.3 - Toast Notifications, Section 2.1 - Navigation Patterns**

- **Permission Errors:**
  - Display 403 errors with clear messaging in toast notification (background: `var(--color-error-light)`, duration: 5s dismiss)
  - Error format: "You don't have permission to [action]. Contact project owner."
  - Use error toast pattern from Section 7.3
- **Visual Indicators:**
  - Show role badges on member list (Owner: `var(--color-primary)`, Member: `var(--color-text-secondary)`)
  - Disable/hide UI elements user lacks permission to use (prevent confusion)
  - Project selector dropdown only shows projects user is member of (Section 2.1)

---

## Story 2.3: User Invitation System

As a project owner,
I want to invite users to my project,
So that my team can collaborate on work items.

**Acceptance Criteria:**

**Given** I am a project owner or admin
**When** I navigate to project settings → Members tab
**Then** I see a list of current members and an "Invite User" button

**And** when I click "Invite User", I see a form to:
- Enter email address or username
- Select role (Member is default, Owner can select Admin)

**And** when I submit valid user information:
- User is added to project immediately
- User appears in members list
- No approval workflow required
- User sees project in their projects list

**And** when I enter invalid user (doesn't exist):
- I see error: "User not found"

**And** when I try to invite user already in project:
- I see error: "User is already a member"

**And** members list shows for each member:
- Username and email
- Role (Owner/Admin/Member)
- Date added
- "Remove" button (owner/admin only, cannot remove self)

**And** when I remove a member:
- Confirmation dialog appears
- Member loses access to project
- Member no longer sees project in their list

**Prerequisites:** Story 2.2

**Technical Notes:**
- Add ORPC mutations: inviteUser, removeUser
- Validate permissions before invite/remove operations
- Prevent owner from removing themselves
- Add member list query with role information
- Create invitation UI in project settings
- Use existing user search/lookup functionality

**UX Design Notes:**

**See UX Design Spec: Section 7.8 - Tabs Pattern, Section 5.5 - Avatar Components, Section 7.9 - Confirmation Dialogs**

- **Settings Navigation:**
  - Use shadcn/ui Tabs component for Project Settings sections
  - Tabs: Overview, Members, Workflow (future)
  - Active tab: Underline (border-bottom: `var(--spacing-xs)` solid `var(--color-primary)`), text color: `var(--color-primary)` (Section 7.8)
- **Members Tab:**
  - Member list: Table layout with columns (Avatar, Name, Email, Role, Date Added, Actions)
  - Avatar: size `var(--spacing-xl)` circles with user initials, colored background (Section 5.5)
  - Role badges: Colored pills (Owner: `var(--color-primary)`, Admin: `var(--color-secondary)`, Member: `var(--color-text-muted)`)
- **Invite User Dialog:**
  - Use shadcn/ui Dialog component (modal, 500px width)
  - Email/username field: Input with search/autocomplete
  - Role selector: Dropdown (default to "Member")
  - Primary button: "Invite User" (background: `var(--color-primary)`)
  - Validation: Email format check, user existence check (async)
- **Member Actions:**
  - Remove button: Outline destructive style (border: `var(--color-error)`, color: `var(--color-error)`)
  - Confirmation dialog: "Remove [User Name] from project?" with Cancel/Remove buttons (Section 7.9)
  - Remove button disabled for self (prevent accidental self-removal)
- **Feedback:**
  - Success: Toast "User [Name] added to project" (background: `var(--color-success-light)`)
  - Error: Inline validation for "User not found" or "User already a member"
  - Remove success: Toast "User [Name] removed from project"

---

## Story 2.4: Ownership Transfer

As a project owner,
I want to transfer ownership to another member,
So that I can hand off project management when needed.

**Acceptance Criteria:**

**Given** I am a project owner
**When** I navigate to project settings → Members tab
**Then** I see a "Transfer Ownership" button

**And** when I click "Transfer Ownership", I see:
- Dropdown to select new owner from current members
- Warning: "You will become a regular member after transfer"
- Confirmation checkbox: "I understand this action cannot be undone"

**And** when I complete the transfer:
- Selected member becomes project owner
- I become a regular member
- All other members remain unchanged
- Activity log records ownership transfer

**And** I can only transfer to existing project members
**And** Admins can also transfer ownership of any project

**Prerequisites:** Story 2.3

**Technical Notes:**
- Add ORPC mutation: transferOwnership
- Require confirmation in UI (double-check pattern)
- Update project_members roles in transaction
- Log transfer event in activity history
- Send notification to new owner (if notification system exists)
- Validate new owner is current member

**UX Design Notes:**

**See UX Design Spec: Section 7.4 - Form Validation, Section 7.9 - Confirmation Dialogs**

- **Transfer Ownership Dialog:**
  - Use shadcn/ui Dialog component (modal, 550px width)
  - Warning banner at top: background `var(--color-warning-light)`, left border `var(--color-warning)` (width: `var(--spacing-xs)`)
  - Warning text: "You will become a regular member after transfer" (prominent, weight: `var(--font-semibold)`)
- **Form Elements:**
  - New owner selector: Dropdown showing current members with avatars (exclude self)
  - Confirmation checkbox: "I understand this action cannot be undone"
  - Checkbox required before submit button activates (Section 7.4)
  - Primary button: "Transfer Ownership" (disabled until checkbox checked)
  - Secondary button: "Cancel"
- **Confirmation Pattern:**
  - Double-check pattern: Checkbox + explicit confirm button (Section 7.9)
  - Submit disabled state: background `var(--color-border)`, cursor not-allowed
  - Submit enabled state: background `var(--color-error)` (destructive action color)
- **Feedback:**
  - Success: Toast "Ownership transferred to [User Name]" (background: `var(--color-success-light)`)
  - Redirect to project overview after success
  - Error: Toast with specific error message if transfer fails

---

## Story 2.5: Project Deletion with Safety Checks

As an admin,
I want to delete projects with appropriate safeguards,
So that I can remove unused projects without accidental data loss.

**Acceptance Criteria:**

**Given** I am a system admin
**When** I view any project settings
**Then** I see a "Delete Project" button in danger zone

**And** when I click "Delete Project", I see confirmation dialog with:
- Warning: "This will permanently delete all project data"
- List of what will be deleted: X cards, X members, X resources
- Text input to type project name for confirmation
- "Delete Forever" button (disabled until name matches)

**And** when I confirm deletion:
- All project data is permanently removed (project, cards, members, resources, comments)
- I am redirected to projects list
- Success message: "Project deleted successfully"

**And** only admins can see the delete button
**And** project owners cannot delete projects (admin-only operation)

**And** soft-delete option:
- Archived projects don't appear in regular lists
- Can be restored within 30 days
- Permanently deleted after 30 days

**Prerequisites:** Story 2.4

**Technical Notes:**
- Add ORPC mutation: deleteProject (admin only)
- Implement cascade deletion for related data
- Use database transaction to ensure atomicity
- Add `deleted_at` timestamp for soft delete
- Create archive view for admins to restore projects
- Add background job to hard-delete after 30 days
- Verify admin role before deletion

**UX Design Notes:**

**See UX Design Spec: Section 7.2 - Button Patterns, Section 7.9 - Confirmation Dialogs**

- **Danger Zone Section:**
  - Located at bottom of Project Settings > Overview tab
  - Separated with red border-top (color: `var(--color-error)`, width: `var(--spacing-xs)`)
  - Section header: "Danger Zone" (color: `var(--color-error)`, weight: `var(--font-semibold)`)
  - "Delete Project" button: Outline destructive style (border: `var(--color-error)`, color: `var(--color-error)`)
- **Delete Confirmation Dialog:**
  - Use shadcn/ui Dialog component (modal, 600px width)
  - Strong visual warning: background banner `var(--color-error-light)` at top
  - Warning icon: Large red warning triangle (size: `var(--spacing-2xl)`)
- **Dialog Content:**
  - Header: "Delete [Project Name]?" (color: `var(--color-error)`, weight: `var(--font-bold)`)
  - Warning message: "This will permanently delete all project data" (prominent)
  - Impact summary list: "X cards, X members, X resources will be deleted"
  - Confirmation input: Text field requiring exact project name match
  - Helper text: "Type project name to confirm" below input field
- **Button States:**
  - "Delete Forever" button: background `var(--color-error)` (destructive primary)
  - Disabled until project name matches exactly (background: `var(--color-border)`)
  - "Cancel" button: background `var(--color-secondary)`
  - Button placement: Right-aligned, destructive on right (Section 7.2)
- **Feedback:**
  - Success: Redirect to projects list + Toast "Project deleted successfully"
  - Loading state: Button shows spinner + "Deleting..." text
  - Error: Toast with retry option if deletion fails
- **Soft Delete UI (Archive):**
  - Admin view: "Archived Projects" section in projects list
  - Archived projects: Gray-out with "Archived" badge
  - Restore button: Outline button "Restore Project" (border: `var(--color-primary)`, color: `var(--color-primary)`)
  - Auto-delete warning: "Will be permanently deleted in X days"

---
