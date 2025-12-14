# Story 2.0: Epic 2 UX Design

Status: ready-for-dev

## Story

As a developer,
I want complete UX designs for all Epic 2 screens and flows,
so that implementation stories have clear visual specifications to follow.

## Acceptance Criteria

### AC1: Screen Components in Storybook
- [ ] Projects list page (empty state, populated state)
- [ ] Project card component (all variants)
- [ ] Project creation dialog
- [ ] Project overview/dashboard layout
- [ ] Project settings page (Overview tab, Members tab)
- [ ] Member invitation dialog
- [ ] Ownership transfer dialog
- [ ] Project deletion confirmation dialog

### AC2: User Flows Documented
- [ ] New user → create first project → land on project dashboard
- [ ] Owner → invite member → member appears in list
- [ ] Owner → transfer ownership → confirmation → role change
- [ ] Admin → delete project → confirmation → redirect

### AC3: Interaction States in Storybook
- [ ] Form validation states (default, error, success)
- [ ] Loading states for async operations
- [ ] Button states (default, hover, disabled, loading)
- [ ] Dialog open/close states
- [ ] Empty states with onboarding cues

### AC4: Component Specifications
- [ ] Project card component with all props documented
- [ ] Member row component with role variants
- [ ] Role badge component (Owner, Admin, Member)
- [ ] Confirmation dialog pattern (reusable)

## Tasks / Subtasks

- [ ] Task 1: Setup Storybook for Epic 2 Components (AC: all)
  - [ ] 1.1 Verify Storybook is configured in project
  - [ ] 1.2 Create `stories/epic-2/` directory structure
  - [ ] 1.3 Setup design token documentation page in Storybook

- [ ] Task 2: Create Project Card Component Stories (AC: 1, 3, 4)
  - [ ] 2.1 Create ProjectCard component with props interface
  - [ ] 2.2 Add Storybook stories: default, hover, loading states
  - [ ] 2.3 Document component props and usage
  - [ ] 2.4 Add responsive viewport stories

- [ ] Task 3: Create Projects List Page Stories (AC: 1, 3)
  - [ ] 3.1 Create ProjectsList layout component
  - [ ] 3.2 Add story: empty state with onboarding CTA
  - [ ] 3.3 Add story: populated state with multiple projects
  - [ ] 3.4 Add story: loading state

- [ ] Task 4: Create Project Creation Dialog Stories (AC: 1, 3)
  - [ ] 4.1 Create ProjectCreationDialog component
  - [ ] 4.2 Add stories: default, validation error, submitting, success
  - [ ] 4.3 Document form field requirements
  - [ ] 4.4 Add story: duplicate name error state

- [ ] Task 5: Create Project Settings Components Stories (AC: 1, 3, 4)
  - [ ] 5.1 Create ProjectSettingsLayout with tabs
  - [ ] 5.2 Create OverviewTab component with edit form
  - [ ] 5.3 Create MembersTab component with table layout
  - [ ] 5.4 Create DangerZone component (admin-only delete)
  - [ ] 5.5 Add stories for each tab state

- [ ] Task 6: Create Member Components Stories (AC: 1, 3, 4)
  - [ ] 6.1 Create MemberRow component with actions
  - [ ] 6.2 Create RoleBadge component (Owner: teal, Admin: gray, Member: muted)
  - [ ] 6.3 Create MemberAvatar component
  - [ ] 6.4 Add stories: different roles, hover states, action states

- [ ] Task 7: Create Member Invitation Dialog Stories (AC: 1, 3)
  - [ ] 7.1 Create InviteMemberDialog component
  - [ ] 7.2 Add stories: default, searching, user found, user not found
  - [ ] 7.3 Add story: user already member error
  - [ ] 7.4 Add story: submitting state

- [ ] Task 8: Create Ownership Transfer Dialog Stories (AC: 1, 3)
  - [ ] 8.1 Create TransferOwnershipDialog component
  - [ ] 8.2 Add warning banner component
  - [ ] 8.3 Add stories: default, checkbox unchecked, checkbox checked, submitting
  - [ ] 8.4 Document confirmation pattern

- [ ] Task 9: Create Project Deletion Dialog Stories (AC: 1, 3)
  - [ ] 9.1 Create DeleteProjectDialog component
  - [ ] 9.2 Add stories: default, name mismatch, name match, deleting
  - [ ] 9.3 Add impact summary component
  - [ ] 9.4 Document destructive action pattern

- [ ] Task 10: Document User Flows (AC: 2)
  - [ ] 10.1 Create user-flows.mdx in Storybook docs
  - [ ] 10.2 Document: New user creates first project
  - [ ] 10.3 Document: Owner invites member
  - [ ] 10.4 Document: Owner transfers ownership
  - [ ] 10.5 Document: Admin deletes project

- [ ] Task 11: Final Integration (AC: all)
  - [ ] 11.1 Verify all components use design tokens
  - [ ] 11.2 Add component index page in Storybook
  - [ ] 11.3 Review accessibility in all stories
  - [ ] 11.4 Create design handoff summary for dev stories

## Dev Notes

### Storybook Structure

**Location:** `apps/web/.storybook/` (or project Storybook root)

**Story Files:**
```
apps/web/src/stories/epic-2/
├── ProjectCard.stories.tsx
├── ProjectsList.stories.tsx
├── ProjectCreationDialog.stories.tsx
├── ProjectSettings.stories.tsx
├── MemberRow.stories.tsx
├── RoleBadge.stories.tsx
├── InviteMemberDialog.stories.tsx
├── TransferOwnershipDialog.stories.tsx
├── DeleteProjectDialog.stories.tsx
└── docs/
    ├── user-flows.mdx
    └── design-tokens.mdx
```

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

### References

- [Source: docs/ux-design-specification.md] - Complete design system
- [Source: docs/epics/epic-2-project-workspace-management.md] - Functional requirements
- [Source: docs/PRD.md#1-project-management] - PRD requirements

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

<!-- To be filled by dev agent -->

### Debug Log References

### Completion Notes List

### File List

## Discoveries

<!-- Document unexpected learnings, findings, and insights discovered during implementation -->

| Discovery | Impact | Action |
|-----------|--------|--------|
| | | |

## Tech Debt Created

<!-- Track any technical debt introduced or deferred during this story -->

| Item | Reason | Tracking |
|------|--------|----------|
| | | |

## Change Log

- 2025-12-12: Story created via create-story workflow (Storybook-centered approach)
