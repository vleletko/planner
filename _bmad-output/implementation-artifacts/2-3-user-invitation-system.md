# Story 2.3: User Invitation System

Status: review

<!-- Note: Validation is optional. If available, run validate-create-story before dev-story. -->

**Goal:** Implement project member invitation/removal with server-enforced RBAC and wire it into the Project Settings → Members tab.

**Scope:**
- Add backend procedures to search invite candidates, list project members, invite a member (immediate add), and remove a member.
- Wire the existing Storybook-ready UI components into the real app settings page.

**Non-goals (explicitly out of scope):**
- Ownership transfer (Story 2.4)
- Project deletion/archiving (Story 2.5)
- Any email-based invite/accept workflow (this story is immediate membership)


## Story

As a project owner (or project admin),
I want to invite users to my project and remove existing members,
so that my team can collaborate within the same workspace.

Notes:
- “Invite” means the user is added to `project_members` immediately (no pending invite state).
- Role assignment on invite defaults to `member`.


## Acceptance Criteria

1. **Given** I am a project `owner` or `admin` **when** I open Project Settings → Members **then** I see the current members list and an "Invite User" action.
2. **Given** I am a project `member` (not owner/admin) **when** I open Project Settings → Members **then** I can view the members list but cannot invite/remove members (UI hidden/disabled + server enforces).
3. **Given** I search for a user by email or display name **when** the user exists **then** I can select non-members to invite and see existing members marked as already on the project.
4. **Given** I invite a valid user **when** the invite succeeds **then**:
   - The user is added to `project_members` immediately (no approval flow)
   - The user appears in the members list
   - The invited user now sees the project in their projects list
5. **Given** I attempt to invite a user that does not exist **when** I submit **then** I see a clear error: "User not found".
6. **Given** I attempt to invite a user that is already a member **when** I submit **then** I see a clear error: "User is already a member".
7. **Given** I remove an existing member **when** I confirm removal **then** the member is deleted from `project_members` and no longer sees the project.
8. **Given** I attempt to remove myself **when** I submit **then** the server rejects the request (cannot remove self).
9. **Given** I attempt to remove the project owner **when** I submit **then** the server rejects the request (owner removal is only possible via ownership transfer in Story 2.4).
10. **Given** an unauthorized user attempts invite/remove **when** they call the API **then** it returns `FORBIDDEN` with a consistent, user-facing message that can be shown in a toast.


## Tasks / Subtasks

### Task 1: Backend - member list + invite/remove procedures (AC: 1-10)
- [x] Add `projects.listMembers` procedure (protected): returns members with user info + role + joinedAt.
- [x] Add `projects.searchInviteCandidates` procedure (protected): search users by email/name, include existing members with an `isMember` flag, return top N.
- [x] Add `projects.inviteMember` mutation (protected): inserts into `project_members` with `invitedBy` + role.
- [x] Add `projects.removeMember` mutation (protected): deletes from `project_members` with safeguards.

### Task 2: Authorization + validation guardrails (AC: 2, 10)
- [x] Enforce project membership and roles via `requireProjectRole(...)` / `requireProjectMember(...)` (Story 2.2 patterns).
- [x] Ensure all `FORBIDDEN` errors use `permissionDeniedMessage(...)` so the UI can show consistent toasts.
- [x] Validate inputs with Zod at the ORPC boundary.

### Task 3: Frontend - wire Members tab into real settings page (AC: 1-9)
- [x] Replace Members tab stub in `apps/web/src/app/projects/[projectId]/settings/project-settings-content.tsx` with real `MembersTab` UI.
- [x] Use TanStack Query + ORPC client (`apps/web/src/utils/orpc.ts`) to:
  - [x] Fetch members via `projects.listMembers`
  - [x] Search invite candidates via `projects.searchInviteCandidates`
  - [x] Invite member via `projects.inviteMember`
  - [x] Remove member via `projects.removeMember`
- [x] Surface success/error via `sonner` toasts (follow existing project settings patterns).

### Task 4: Regression coverage (AC: 2, 7, 8, 10)
- [x] Add Playwright E2E coverage for:
  - [x] Owner/admin can invite an existing user
  - [x] Invited user sees project in `projects.list`
  - [x] Owner/admin can remove a member (not self)
  - [x] Member cannot invite/remove (server returns `FORBIDDEN`)

### Task 5: Sprint status bookkeeping
- [x] Ensure `sprint-status.yaml` sets this story to `ready-for-dev`.


## Dev Notes

**What already exists (do not recreate):**
- UI components (Storybook-ready, callback-driven):
  - `apps/web/src/components/projects/invite-member-dialog.tsx`
  - `apps/web/src/components/projects/project-settings/members-tab.tsx`
  - Supporting hook: `apps/web/src/components/projects/hooks/use-invite-user-search.ts` (expects an injected async search function)
- DB support:
  - `packages/db/src/schema/projects.ts` defines `project_members` with `role`, `invitedBy`, `joinedAt` and a uniqueness constraint `(project_id, user_id)`.
  - `packages/db/src/schema/auth.ts` defines `user` with `id`, `name`, `email`, `image`.
- AuthZ helpers + permission matrix (Story 2.2):
  - `packages/api/src/lib/authz/project.server.ts` (`requireProjectMember`, `requireProjectRole`)
  - `packages/api/src/lib/authz/project.ts` (`PROJECT_PERMISSIONS.MEMBERS_INVITE`, `MEMBERS_REMOVE`, etc.)

**What is missing (this story’s actual work):**
- Backend ORPC procedures to list members, search users to invite, invite, and remove.
- Runtime wiring of the settings page: `apps/web/src/app/projects/[projectId]/settings/project-settings-content.tsx` currently renders a "coming soon" stub for member management.

**Key behavior decision (match epic + keep simple):**
- Invitation is immediate membership (no pending invite record).
- Search is used for selection UX, but the invite mutation should be authoritative and validate user existence + membership server-side.


### Technical Requirements

Backend (ORPC):
- `projects.listMembers` (protected)
  - Input: `{ projectId: string }`
  - AuthZ: `requireProjectMember` (any role)
  - Output: `Array<{ user: { id, name, email, image }, role: "owner"|"admin"|"member", joinedAt: string, invitedBy?: { id, name, email } | null }>` (shape can be simplified, but must include role + joinedAt)

- `projects.searchInviteCandidates` (protected)
  - Input: `{ projectId: string, query: string }`
  - AuthZ: `requireProjectRole` with `PROJECT_PERMISSIONS.MEMBERS_INVITE`
  - Behavior:
    - Search `user.email` and `user.name` case-insensitively
    - Trim query; reject empty/very short queries (e.g., <2 chars) with `BAD_REQUEST`
    - Include users already in `project_members` for that project and mark them with `isMember: true`
    - Limit results (e.g., 10)

- `projects.inviteMember` (protected mutation)
  - Input: `{ projectId: string, userId: string, role?: "member"|"admin" }`
  - AuthZ: `requireProjectRole` with `PROJECT_PERMISSIONS.MEMBERS_INVITE`
  - Behavior:
    - Default role: `member`
    - Prevent inviting existing member → `BAD_REQUEST` with message "User is already a member"
    - Non-existent user → `NOT_FOUND` or `BAD_REQUEST` with message "User not found" (must match UX message)
    - Insert into `project_members` with `invitedBy = ctx.session.user.id`

- `projects.removeMember` (protected mutation)
  - Input: `{ projectId: string, userId: string }` (userId = member to remove)
  - AuthZ: `requireProjectRole` with `PROJECT_PERMISSIONS.MEMBERS_REMOVE`
  - Behavior:
    - Prevent removing self → `BAD_REQUEST`
    - Prevent removing the project owner → `BAD_REQUEST`
    - Deleting a non-member → `NOT_FOUND` (or `BAD_REQUEST`) with a clear message

Frontend:
- Wire `InviteMemberDialog` search + invite callbacks to the real ORPC procedures.
- Wire `MembersTab` member list + remove callbacks to the real ORPC procedures.
- Error UX:
  - Permission denials must surface as toasts with the server message.
  - "User not found" and "User is already a member" should be displayed inline in the dialog (as the component already supports).


### Architecture Compliance

- Use ORPC procedures in `packages/api/src/routers/projects.ts` and merge via `packages/api/src/routers/index.ts` (existing router surface).
- AuthN: use `protectedProcedure` + Better-Auth session in ORPC context (`packages/api/src/context.ts`).
- AuthZ: do not inline role checks; use the established helpers in `packages/api/src/lib/authz/project.server.ts`.
- DB access: use Drizzle via `@planner/db` and the existing `projectMembers`, `projects`, and `user` tables.
- Avoid duplicating UI components: integrate the existing callback-driven components into the real Next.js route.
- Keep server responses minimal and typed; prefer returning exactly what the UI needs.


### Library / Framework Requirements

- **API:** ORPC (`@orpc/server`) + Zod for input validation (follow existing router patterns).
- **DB:** Drizzle ORM via `@planner/db`.
- **Auth:** Better-Auth session from ORPC context; no custom auth parsing.
- **Web:** React 19 + Next.js App Router.
- **Data fetching:** TanStack Query (already used via ORPC client integration).
- **UI:** shadcn/ui components already used in existing project settings components; toasts via `sonner`.
- **No new dependencies** for RBAC or invites.


### File Structure Requirements

Backend:
- Add new procedures to `packages/api/src/routers/projects.ts` (keep them grouped near other project-scoped procedures).
- Reuse authz helpers from `packages/api/src/lib/authz/project.server.ts` and permission constants from `packages/api/src/lib/authz/project.ts`.

Frontend:
- Replace the members stub in `apps/web/src/app/projects/[projectId]/settings/project-settings-content.tsx` with real member management UI.
- Prefer wiring the existing components in `apps/web/src/components/projects/` rather than creating new ones.
- If introducing new hooks, keep them near existing ones:
  - `apps/web/src/components/projects/hooks/*`

Data shapes:
- Prefer a single "members list" query that returns both member and user data to avoid N+1 client fetching.


### Testing Requirements

- Add/extend Playwright E2E tests under `apps/e2e/tests/projects/` (follow the pattern used in Story 2.2).
- Ensure tests cover:
  - Happy path invite (owner/admin)
  - Already-member and user-not-found errors
  - Removal happy path + cannot remove self
  - Permission denials for `member` role
- Run at least: `bun run test:e2e` and `bun run test` (unit) after wiring.


### Project Context Reference

- No `project-context.md` found via `**/project-context.md`.
- Treat these as authoritative context:
  - `docs/epics/epic-2-project-workspace-management.md` (Story 2.3)
  - `docs/PRD.md` (Access Control + User Invitation)
  - `docs/architecture.md` (project router patterns + security patterns)


### Story Completion Status

- Status is `ready-for-dev`.
- Completion note: "Ultimate context engine analysis completed - comprehensive developer guide created".
- Workflow note: `_bmad/core/tasks/validate-workflow.xml` is not present in this repo, so checklist automation cannot run; do a manual story read-through before starting `dev-story`.


### References

- [Source: docs/epics/epic-2-project-workspace-management.md#Story 2.3: User Invitation System]
- [Source: docs/PRD.md#User Invitation]
- [Source: docs/architecture.md#Project Routers]
- [Source: _bmad-output/implementation-artifacts/2-2-project-access-control-and-permissions.md]

## Dev Agent Record

### Agent Model Used

GPT-5.2 (Codex CLI)

### Debug Log References

- `bun run check`
- `bun run check-types`
- `bun run test`
- `bun run test:storybook`
- `bun run build`
- `bun run test:e2e`

### Completion Notes List

- Implemented `projects.listMembers`, `projects.searchInviteCandidates`, `projects.inviteMember`, and `projects.removeMember` with `protectedProcedure`, Zod inputs, and Story 2.2 authz helpers.
- Wired Project Settings → Members to real ORPC calls (invite dialog search + invite, members list + remove with confirmation) and surfaced success/errors via `sonner`.
- Added Playwright E2E coverage for invite/remove flows and server-side `FORBIDDEN` enforcement.

### File List

- `_bmad-output/implementation-artifacts/2-3-user-invitation-system.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `packages/api/src/routers/projects.ts`
- `apps/web/src/app/projects/[projectId]/settings/project-settings-content.tsx`
- `apps/web/src/components/projects/hooks/use-invite-user-search.ts`
- `apps/web/src/components/projects/invite-member-dialog.tsx`
- `apps/e2e/tests/projects/projects.spec.ts`
- `apps/e2e/src/utils/console-errors.ts`

### Change Log

- 2026-01-15: Implemented member invite/remove (API + UI) and added E2E coverage; status set to `review`.
