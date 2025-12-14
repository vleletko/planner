# Story 2.0: Epic 2 UX Design

Status: in-progress

## Story

As a developer,
I want complete UX designs for all Epic 2 screens and flows,
so that implementation stories have clear visual specifications to follow.

## Acceptance Criteria

### AC1: Screen Components in Storybook
- [x] Projects list page (empty state, populated state)
- [x] Project card component (all variants)
- [x] Project creation dialog
- [x] Project overview/dashboard layout
- [x] Project settings page (Overview tab, Members tab)
- [ ] Member invitation dialog
- [ ] Ownership transfer dialog
- [ ] Project deletion confirmation dialog

### AC2: User Flows Documented
- [ ] New user → create first project → land on project dashboard
- [ ] Owner → invite member → member appears in list
- [ ] Owner → transfer ownership → confirmation → role change
- [ ] Admin → delete project → confirmation → redirect

### AC3: Interaction States in Storybook
- [x] Form validation states (default, error, success)
- [x] Loading states for async operations
- [x] Button states (default, hover, disabled, loading)
- [x] Dialog open/close states
- [x] Empty states with onboarding cues

### AC4: Component Specifications
- [x] Project card component with all props documented
- [x] Member row component with role variants
- [x] Role badge component (Owner, Admin, Member)
- [ ] Confirmation dialog pattern (reusable)

## Tasks / Subtasks

- [x] Task 1: Setup for Epic 2 Components (AC: all)
  - [x] 1.1 Install shadcn/ui: `npx shadcn@latest add dialog tabs avatar table badge alert-dialog select`
  - [x] 1.2 Create `components/projects/` directory with mock data file
  - [x] 1.3 Create `projects/__mocks__/` folder for any module mocks if needed
  - [x] 1.4 Verify design tokens render correctly in Storybook

- [x] Task 2: Create Project Card Component Stories (AC: 1, 3, 4)
  - [x] 2.1 Create ProjectCard component with typed props interface
  - [x] 2.2 Add Default story with `tags: ["autodocs"]` for prop documentation
  - [x] 2.3 Add HoverState story showing hover styling
  - [x] 2.4 Add LoadingState story with skeleton placeholder
  - [x] 2.5 Add responsive viewport stories (mobile, tablet, desktop)

- [x] Task 3: Create Projects List Page Stories (AC: 1, 3)
  - [x] 3.1 Create ProjectsList layout component with typed props
  - [x] 3.2 Add EmptyState story with "Create your first project" CTA button
  - [x] 3.3 Add PopulatedState story using mockProjects array (3+ projects)
  - [x] 3.4 Add LoadingState story with skeleton grid

- [x] Task 4: Create Project Creation Dialog Stories (AC: 1, 3)
  - [x] 4.1 Create ProjectCreationDialog with controlled `isOpen`/`onOpenChange` props
  - [x] 4.2 Add meta with Toast decorator (see sign-in-form.stories.tsx:36-43)
  - [x] 4.3 Add Default story (dialog open, form empty)
  - [x] 4.4 Add ValidationError story (name field with inline error)
  - [x] 4.5 Add Submitting story (button disabled with spinner)
  - [x] 4.6 Add DuplicateNameError story (server validation error)
  - [x] 4.7 Add interaction stories using `within(document.body)` for portal content

- [x] Task 5: Create Project Settings Components Stories (AC: 1, 3, 4)
  - [x] 5.1 Create ProjectSettingsLayout with Tabs component
  - [x] 5.2 Create OverviewTab with edit form and save button
  - [x] 5.3 Create MembersTab with Table layout and member data
  - [x] 5.4 Create DangerZone with destructive button styling
  - [x] 5.5 Add stories for each tab: OverviewDefault, MembersWithData, DangerZoneAdminOnly

- [x] Task 6: Create Member Components Stories (AC: 1, 3, 4)
  - [x] 6.1 Create MemberRow component with action buttons (Remove, Transfer)
  - [x] 6.2 Create RoleBadge with variant styling (owner=primary, admin=secondary, member=muted)
  - [x] 6.3 Create MemberAvatar with fallback initials
  - [x] 6.4 Add stories: OwnerRole, AdminRole, MemberRole, HoverWithActions

- [ ] Task 7: Create Member Invitation Dialog Stories (AC: 1, 3)
  - [ ] 7.1 Create InviteMemberDialog with controlled props and Toast decorator
  - [ ] 7.2 Add Default story (dialog open, search field empty)
  - [ ] 7.3 Add SearchingState story (loading spinner in field)
  - [ ] 7.4 Add UserFound story (user preview with invite button)
  - [ ] 7.5 Add UserNotFound story (error message displayed)
  - [ ] 7.6 Add AlreadyMember story (validation error state)
  - [ ] 7.7 Add interaction stories with portal-aware queries

- [ ] Task 8: Create Ownership Transfer Dialog Stories (AC: 1, 3)
  - [ ] 8.1 Create TransferOwnershipDialog with controlled props
  - [ ] 8.2 Create WarningBanner component (amber background, left border)
  - [ ] 8.3 Add Default story (checkbox unchecked, submit disabled)
  - [ ] 8.4 Add CheckboxChecked story (submit button enabled)
  - [ ] 8.5 Add Submitting story (button with spinner)
  - [ ] 8.6 Add interaction stories: checkbox toggle enables button, form submit

- [ ] Task 9: Create Project Deletion Dialog Stories (AC: 1, 3)
  - [ ] 9.1 Create DeleteProjectDialog with controlled props and impact data
  - [ ] 9.2 Add Default story (name input empty, delete disabled)
  - [ ] 9.3 Add NameMismatch story (partial input, delete still disabled)
  - [ ] 9.4 Add NameMatch story (exact match, delete enabled with error styling)
  - [ ] 9.5 Add Deleting story (button with spinner, input disabled)
  - [ ] 9.6 Create ImpactSummary component (shows card/member/resource counts)
  - [ ] 9.7 Add interaction stories: type name to enable delete button

- [ ] Task 10: Document User Flows (AC: 2)
  - [ ] 10.1 Create user-flows.mdx in Storybook docs folder
  - [ ] 10.2 Document flow: New user → Projects (empty) → Create dialog → Dashboard
  - [ ] 10.3 Document flow: Owner → Settings → Members → Invite → Success toast
  - [ ] 10.4 Document flow: Owner → Members → Transfer → Confirm checkbox → Role change
  - [ ] 10.5 Document flow: Admin → Settings → Danger Zone → Type name → Delete

- [ ] Task 11: Final Integration (AC: all)
  - [ ] 11.1 Verify all components use semantic tokens (bg-background, text-foreground, etc.)
  - [ ] 11.2 Add component index page grouping all Projects/ stories
  - [ ] 11.3 Run a11y addon checks: focus management, aria-labels, keyboard navigation
  - [ ] 11.4 Create design handoff summary listing all component props and usage

## Dev Notes

### Component & Story Structure

**Location:** `apps/web/src/components/projects/` (feature-based, matching `auth/`, `layout/` pattern)

**Files (component + co-located stories):**
```
apps/web/src/components/projects/
├── project-card.tsx
├── project-card.stories.tsx                         → "Projects/ProjectCard"
├── projects-list.tsx
├── projects-list.stories.tsx                        → "Projects/ProjectsList"
├── project-creation-dialog.tsx
├── project-creation-dialog.stories.tsx              → "Projects/ProjectCreationDialog"
├── project-creation-dialog.interactions.stories.tsx → "Projects/ProjectCreationDialog/Interactions"
├── project-settings/
│   ├── project-settings-layout.tsx
│   ├── project-settings-layout.stories.tsx          → "Projects/Settings/Layout"
│   ├── overview-tab.tsx
│   ├── overview-tab.stories.tsx                     → "Projects/Settings/OverviewTab"
│   ├── members-tab.tsx
│   ├── members-tab.stories.tsx                      → "Projects/Settings/MembersTab"
│   ├── danger-zone.tsx
│   └── danger-zone.stories.tsx                      → "Projects/Settings/DangerZone"
├── member-row.tsx
├── member-row.stories.tsx                           → "Projects/MemberRow"
├── role-badge.tsx
├── role-badge.stories.tsx                           → "Projects/RoleBadge"
├── invite-member-dialog.tsx
├── invite-member-dialog.stories.tsx                 → "Projects/InviteMemberDialog"
├── invite-member-dialog.interactions.stories.tsx    → "Projects/InviteMemberDialog/Interactions"
├── transfer-ownership-dialog.tsx
├── transfer-ownership-dialog.stories.tsx            → "Projects/TransferOwnershipDialog"
├── transfer-ownership-dialog.interactions.stories.tsx → "Projects/TransferOwnershipDialog/Interactions"
├── delete-project-dialog.tsx
├── delete-project-dialog.stories.tsx                → "Projects/DeleteProjectDialog"
└── delete-project-dialog.interactions.stories.tsx   → "Projects/DeleteProjectDialog/Interactions"
```

**Naming Convention:**
- Visual stories: `component-name.stories.tsx`
- Interaction stories: `component-name.interactions.stories.tsx`
- Title format: `"Projects/ComponentName"` or `"Projects/ComponentName/Interactions"`

### Design System Reference
- **Base System:** shadcn/ui (New York style) + Tailwind CSS
- **Color Theme:** Balanced Teal
- **Primary:** `#14b8a6` (Teal-500)
- **Primary Hover:** `#0d9488` (Teal-600)
- **Error:** `#f43f5e` (Rose-500)
- **Success:** `#10b981` (Emerald-500)
- **Warning:** `#f59e0b` (Amber-500)

### Key UX Spec Sections
- Section 1.1 - Design System Choice (shadcn/ui)
- Section 3.1 - Color System (Balanced Teal)
- Section 6.2 - Design Tokens
- Section 7.2 - Button Patterns
- Section 7.3 - Toast Notifications
- Section 7.4 - Form Validation
- Section 7.7 - Empty States
- Section 7.8 - Tabs Pattern
- Section 7.9 - Confirmation Dialogs

### Mock Data Factories

Create `components/projects/mock-data.ts` with reusable test data:

```typescript
// Mock project data for stories
export const mockProject = {
  id: "project-123",
  name: "My Project",
  description: "A sample project for testing",
  memberCount: 3,
  createdAt: new Date("2025-01-15"),
  role: "owner" as const,
};

export const mockProjects = [
  mockProject,
  { ...mockProject, id: "project-456", name: "Second Project", role: "admin" as const },
  { ...mockProject, id: "project-789", name: "Third Project", role: "member" as const },
];

// Mock member data for stories
export const mockMember = {
  user: { name: "John Doe", email: "john@example.com", avatar: null },
  role: "member" as const,
  addedAt: new Date("2025-01-20"),
};

export const mockMembers = [
  { ...mockMember, user: { name: "Alice Owner", email: "alice@example.com", avatar: null }, role: "owner" as const },
  { ...mockMember, user: { name: "Bob Admin", email: "bob@example.com", avatar: null }, role: "admin" as const },
  mockMember,
];

// Impact data for deletion dialog
export const mockImpactData = {
  cardCount: 24,
  memberCount: 5,
  resourceCount: 12,
};
```

### Component Props Patterns

**Project Card:**
```typescript
interface ProjectCardProps {
  name: string;
  description?: string;
  memberCount: number;
  createdAt: Date;
  role: 'owner' | 'admin' | 'member';
  onClick?: () => void;
}
```

**Role Badge:**
```typescript
interface RoleBadgeProps {
  role: 'owner' | 'admin' | 'member';
  size?: 'sm' | 'md';
}
// Colors: owner=primary, admin=secondary, member=muted
```

**Member Row:**
```typescript
interface MemberRowProps {
  user: { name: string; email: string; avatar?: string };
  role: 'owner' | 'admin' | 'member';
  addedAt: Date;
  canRemove: boolean;
  canTransfer: boolean;
  onRemove?: () => void;
  onTransferOwnership?: () => void;
}
```

### Dialog Props Pattern (All Dialogs)

All dialog components follow controlled component pattern:

```typescript
// Base pattern - all dialogs extend this
interface BaseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Project Creation Dialog
interface ProjectCreationDialogProps extends BaseDialogProps {
  onSuccess?: (project: { name: string; description?: string }) => void;
}

// Invite Member Dialog
interface InviteMemberDialogProps extends BaseDialogProps {
  projectId: string;
  onSuccess?: (member: { email: string; role: string }) => void;
}

// Transfer Ownership Dialog
interface TransferOwnershipDialogProps extends BaseDialogProps {
  projectId: string;
  currentMembers: Array<{ id: string; name: string; email: string }>;
  onSuccess?: (newOwnerId: string) => void;
}

// Delete Project Dialog
interface DeleteProjectDialogProps extends BaseDialogProps {
  projectName: string;
  impact: { cardCount: number; memberCount: number; resourceCount: number };
  onConfirm?: () => void;
}
```

### Critical Import Rules (Storybook 10)

**Use `storybook/test` (not `@storybook/test`):**
```tsx
// ✅ CORRECT
import { expect, fn, userEvent, within, sb } from "storybook/test";

// ❌ WRONG - causes errors in Storybook 10
import { ... } from "@storybook/test";
```

**Types from framework package:**
```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
```

**Extract regex patterns to module level** (Biome performance rule):
```tsx
// ✅ CORRECT - regex at module level
const SUBMIT_BUTTON = /submit/i;

export const ClickTest: Story = {
  play: async ({ canvasElement }) => {
    const button = canvas.getByRole("button", { name: SUBMIT_BUTTON });
  },
};
```

### Story Decorator Patterns

**Toast Decorator (Required for Dialogs)**

All dialog stories need Toast for success/error feedback (see sign-in-form.stories.tsx:36-43):

```tsx
import { Toaster } from "@/components/ui/sonner";

const meta = {
  title: "Projects/ProjectCreationDialog",
  component: ProjectCreationDialog,
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
  // ... rest of meta
} satisfies Meta<typeof ProjectCreationDialog>;
```

**Theme Provider Decorator (If Theme-Dependent)**

For components using theme tokens (see authenticated-header.stories.tsx:62-73):

```tsx
import { ThemeProvider } from "next-themes";

decorators: [
  (Story) => (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Story />
    </ThemeProvider>
  ),
],
```

### Radix Portal Testing Pattern

**CRITICAL: Radix dialogs render content outside `canvasElement` via portals.**

For interaction stories testing dialog content:

```tsx
export const SubmitForm: Story = {
  args: { isOpen: true },
  play: async ({ canvasElement }) => {
    // ❌ WRONG - dialog content not in canvasElement
    // const canvas = within(canvasElement);

    // ✅ CORRECT - Radix portals to document.body
    const dialogCanvas = within(document.body);

    const nameInput = dialogCanvas.getByLabelText(/project name/i);
    const submitButton = dialogCanvas.getByRole("button", { name: /create/i });

    await userEvent.type(nameInput, "New Project");
    await userEvent.click(submitButton);

    await expect(dialogCanvas.getByText(/project created/i)).toBeInTheDocument();
  },
};
```

**Note:** `canvasElement` still works for the trigger button that opens the dialog.

### References

- [Source: docs/ux-design-specification.md] - Complete design system (Sections 1.1, 3.1, 7.2-7.9)
- [Source: docs/epics/epic-2-project-workspace-management.md] - Functional requirements and UX notes
- [Source: docs/PRD.md#1-project-management] - PRD requirements
- [Source: .claude/rules/frontend/storybook.md] - Storybook patterns and conventions
- [Source: docs/component-inventory.md] - Existing shadcn/ui components and patterns

### Existing Patterns to Follow

Study these files before implementing - they contain proven patterns:

| File | Key Pattern | Lines |
|------|-------------|-------|
| `sign-in-form.stories.tsx` | Mock session data, beforeEach setup, Toast decorator | 7-54 |
| `sign-in-form.interactions.stories.tsx` | userEvent interactions, regex patterns at module level | 1-80 |
| `authenticated-header.stories.tsx` | ThemeProvider decorator, reusable play function factory | 31-47, 62-73 |
| `authenticated-header.interactions.stories.tsx` | Menu interaction with portal-aware queries | Full file |

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- To be filled by dev agent -->

### Debug Log References

### Completion Notes List

- Tasks 1-6 completed with full mobile responsiveness
- All components use responsive padding/gaps (px-4 sm:px-6, gap-4 sm:gap-6)
- Storybook viewport stories added for mobile/tablet/desktop
- MemberRow and MemberActions extracted as internal components within members-tab.tsx
- Card UI component updated with responsive defaults

**Design Enhancements Applied (Refined Workspace aesthetic):**
- Project Settings header: teal gradient avatar + gradient accent line
- Tabs: compact pill-style buttons with border/shadow active states
- Members: role-based avatar rings (owner=teal, admin=muted), hover accent bar, enhanced empty state
- Forms: teal focus glow, save button hover shadow, pulsing amber "unsaved" indicator
- Danger Zone: circular icon badge, subtle breathing border, delete button shadow

### File List

**Components Created:**
- `apps/web/src/components/projects/mock-data.ts`
- `apps/web/src/components/projects/project-card.tsx`
- `apps/web/src/components/projects/project-card.stories.tsx`
- `apps/web/src/components/projects/projects-list.tsx`
- `apps/web/src/components/projects/projects-list.stories.tsx`
- `apps/web/src/components/projects/project-creation-dialog.tsx`
- `apps/web/src/components/projects/project-creation-dialog.stories.tsx`
- `apps/web/src/components/projects/project-creation-dialog.interactions.stories.tsx`
- `apps/web/src/components/projects/project-settings/project-settings-layout.tsx`
- `apps/web/src/components/projects/project-settings/project-settings-layout.stories.tsx`
- `apps/web/src/components/projects/project-settings/overview-tab.tsx`
- `apps/web/src/components/projects/project-settings/overview-tab.stories.tsx`
- `apps/web/src/components/projects/project-settings/members-tab.tsx`
- `apps/web/src/components/projects/project-settings/members-tab.stories.tsx`
- `apps/web/src/components/projects/project-settings/danger-zone.tsx`
- `apps/web/src/components/projects/project-settings/danger-zone.stories.tsx`

**UI Components Modified (responsive improvements):**
- `apps/web/src/components/ui/card.tsx` - responsive gap/padding
- `apps/web/src/components/ui/input.tsx` - text-sm font size
- `apps/web/src/components/ui/textarea.tsx` - text-sm font size

**Config Updated:**
- `apps/web/.storybook/preview.ts` - viewport config, initialGlobals

## Discoveries

<!-- Document unexpected learnings, findings, and insights discovered during implementation -->

| Discovery | Impact | Action |
|-----------|--------|--------|
| Storybook 10 viewport API changed | `defaultViewport` in parameters deprecated | Use `globals: { viewport: { value: "name" } }` for story-level, `initialGlobals` for preview.ts |
| Import from `storybook/test` not `@storybook/test` | Causes errors if wrong import used | Updated all story files to use correct import |
| Card component `gap-6` too large on mobile | Cards looked cramped on 320px viewport | Made Card responsive: `gap-4 sm:gap-6`, `py-4 sm:py-6`, `px-4 sm:px-6` |
| Input/Textarea `text-base` (16px) too large on mobile | Form fields visually heavy | Changed to `text-sm` (14px) consistently |
| MemberRow extracted from MembersTab | Biome `noExcessiveCognitiveComplexity` rule | Extracted MemberRow and MemberActions as separate components |

## Tech Debt Created

<!-- Track any technical debt introduced or deferred during this story -->

| Item | Reason | Tracking |
|------|--------|----------|
| | | |

## Change Log

- 2025-12-14: Design enhancements - "Refined Workspace" aesthetic applied to project settings (avatar, tabs, member rings, form interactions, danger zone)
- 2025-12-14: Tasks 1-6 completed - all core components created with mobile responsiveness, Card/Input/Textarea UI components updated
- 2025-12-14: Validation improvements applied - mock data factories, dialog props, portal patterns, decorator examples, specific task names
- 2025-12-14: Updated to align with established Storybook patterns (feature-based paths, interaction stories, import rules)
- 2025-12-12: Story created via create-story workflow (Storybook-centered approach)
