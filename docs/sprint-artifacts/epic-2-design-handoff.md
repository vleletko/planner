# Epic 2: Project Management - Design Handoff

## Overview

This document summarizes the UX design deliverables for Epic 2 Project Management components, ready for development integration.

**Epic:** 2 - Project Management
**Sprint:** Current
**Status:** Complete
**Storybook:** `bun run --filter=web storybook` → http://localhost:6006

---

## Components Delivered

### 1. DeleteProjectDialog

**Location:** `apps/web/src/components/projects/delete-project-dialog.tsx`

**Props:**

| Prop           | Type                                            | Required | Description                          |
| -------------- | ----------------------------------------------- | -------- | ------------------------------------ |
| `isOpen`       | `boolean`                                       | Yes      | Controls dialog visibility           |
| `onOpenChange` | `(open: boolean) => void`                       | Yes      | Callback when dialog state changes   |
| `projectName`  | `string`                                        | Yes      | Name user must type to confirm       |
| `impact`       | `{ cardCount, memberCount, resourceCount }`     | Yes      | Stats shown in impact summary        |
| `onConfirm`    | `() => void`                                    | No       | Callback when deletion confirmed     |
| `isSubmitting` | `boolean`                                       | No       | Shows loading state when true        |

**Stories:**
- Default, LongProjectName, LargeImpact, MinimalImpact, Deleting, Mobile, Tablet
- Interactions: TypeNameToEnableDelete, SubmitDeletion, CaseSensitiveMatch, CancelDialog, MismatchShowsError

---

### 2. TransferOwnershipDialog

**Location:** `apps/web/src/components/projects/transfer-ownership-dialog.tsx`

**Props:**

| Prop             | Type                      | Required | Description                        |
| ---------------- | ------------------------- | -------- | ---------------------------------- |
| `isOpen`         | `boolean`                 | Yes      | Controls dialog visibility         |
| `onOpenChange`   | `(open: boolean) => void` | Yes      | Callback when dialog state changes |
| `projectId`      | `string`                  | Yes      | Project identifier                 |
| `projectName`    | `string`                  | Yes      | Shown in description               |
| `currentMembers` | `TransferableMember[]`    | Yes      | Eligible members for selection     |
| `onTransfer`     | `(newOwnerId: string) => void` | No  | Callback with selected member ID   |
| `isSubmitting`   | `boolean`                 | No       | Shows loading state when true      |

**Stories:**
- Default, NoEligibleMembers, ManyMembers, Transferring, Mobile, Tablet
- Interactions: SelectMemberAndCheckbox, SubmitTransfer, CheckboxToggleEnablesButton, CancelDialog

---

### 3. InviteMemberDialog

**Location:** `apps/web/src/components/projects/invite-member-dialog.tsx`

**Key Features:**
- Debounced user search (300ms)
- Multi-select with pill UI
- Role selection (Member/Admin)
- Loading states for search and submission

---

### 4. ProjectCreationDialog

**Location:** `apps/web/src/components/projects/project-creation-dialog.tsx`

**Key Features:**
- Name validation (required, max length)
- Optional description field
- Real-time validation feedback
- Submitting state with spinner

---

## Design Tokens Used

### Semantic Colors
- `bg-background` / `text-foreground` - Base colors
- `bg-muted` / `text-muted-foreground` - Secondary elements
- `bg-primary` - Primary actions
- `bg-destructive` - Delete/danger actions
- `border-border` - Default borders

### Status Colors
- Destructive: `bg-destructive/5`, `border-destructive/30`, `text-destructive`
- Warning: `bg-amber-500/5`, `border-amber-500/30`, `text-amber-600`

### Spacing Scale
- Dialog max-width: `sm:max-w-[550px]`
- Section gaps: `space-y-5` or `mt-5 sm:mt-6`
- Icon badges: `size-10` container, `size-5` icon
- Button min-width: `sm:min-w-[140px]`

### Typography
- Dialog title: `font-semibold text-lg tracking-tight`
- Description: `text-muted-foreground text-sm`
- Labels: `font-medium text-sm`
- Error messages: `text-destructive text-sm`

---

## Accessibility Compliance

All dialogs implement:
- [x] Focus trapping within modal
- [x] Escape key to close
- [x] `aria-describedby` for form errors
- [x] `aria-invalid` on invalid inputs
- [x] Proper heading hierarchy
- [x] Screen reader announcements for state changes
- [x] Keyboard navigation support

---

## Storybook URLs

All components are accessible via the Storybook sidebar under "Projects/". Each component has autodocs enabled for prop documentation.

| Component                | Path                                           |
| ------------------------ | ---------------------------------------------- |
| ProjectCard              | `/docs/projects-projectcard--docs`             |
| ProjectsList             | `/docs/projects-projectslist--docs`            |
| ProjectCreationDialog    | `/docs/projects-projectcreationdialog--docs`   |
| InviteMemberDialog       | `/docs/projects-invitememberdialog--docs`      |
| TransferOwnershipDialog  | `/docs/projects-transferownershipdialog--docs` |
| DeleteProjectDialog      | `/docs/projects-deleteprojectdialog--docs`     |

---

## Integration Notes

### Mock Data

All dialogs have corresponding mock data in `mock-data.ts`:
- `mockImpactData` - DeleteProjectDialog impact stats
- `mockTransferableMembers` - TransferOwnershipDialog member list
- `mockUsers` - InviteMemberDialog search results

### Testing

Run interaction tests to verify behavior:
```bash
bun run test:storybook
```

All dialogs have comprehensive interaction stories testing:
- Form validation
- Button enable/disable states
- Callback invocations
- Keyboard navigation

---

## Next Steps for Development

1. Connect dialogs to API endpoints
2. Implement actual search in InviteMemberDialog
3. Add toast notifications for success/error states
4. Wire up navigation after destructive actions (delete → projects list)
