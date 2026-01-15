# Story 2.2: Project Access Control and Permissions

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a system,
I want to enforce role-based permissions on project operations,
so that only authorized users can perform sensitive actions.

## Acceptance Criteria

1. **Given** a project with defined roles (Owner, Admin, Member) **when** a user attempts any project-scoped operation **then** the system validates their permission level server-side before performing the operation.
2. **Given** a user is not a member of a project **when** they request that project (or any project-scoped resource) **then** the request is denied and the project does not appear in their project list.
3. **Given** a Project Owner **when** they perform owner actions **then** they are allowed to:
   - Edit project settings (name, description)
   - Invite users to the project
   - Transfer ownership to another member
   - Delete project (with confirmation)
   - Perform all member actions (create/edit/move cards, manage resources)
4. **Given** a Project Admin **when** they perform admin actions **then** they are allowed to:
   - Edit project settings (name, description)
   - Invite/remove members and promote/demote members
   - Perform all member actions
   - Not perform owner-only actions (ownership transfer, deletion) unless explicitly supported in later stories
   - Note: "system admin" (global) is described in `docs/architecture.md` but not implemented in DB schema yet
5. **Given** a Project Member **when** they use the product **then** they are allowed to:
   - View the project and read project settings
   - Create, edit, and move cards
   - Create and manage resources
   - Not invite users or configure project settings
6. **Given** an unauthorized user action **when** the system denies it **then** it returns a `403 Forbidden` error with a clear message describing required permission.
7. **Given** the UI is rendering project-related actions **when** the current user lacks permission **then** sensitive UI controls are hidden or disabled to reduce confusion (without relying on UI checks for security).
8. **Given** the project selector / projects list **when** it loads **then** it only shows projects where the user is a member.
9. **Given** permission errors occur during user actions **when** they are surfaced to the user **then** they follow the UX error pattern (toast) and use a clear message format like: "You don't have permission to [action]. Contact project owner.".

## Tasks / Subtasks

### Task 1: Define the permission model (AC: 1, 3, 4, 5)

- [x] Document a concrete permission matrix for project roles (`owner`, `admin`, `member`) covering:
  - [x] Project settings update (name/description)
  - [x] Members management actions (invite/remove/change role)
  - [x] Ownership transfer
  - [x] Deletion / archiving (admin-only if applicable)
  - [x] Future project-scoped routers (statuses, card types, fields, cards, resources)

  Implemented in `packages/api/src/lib/authz/project.ts` and verified with `packages/api/src/lib/authz/project.test.ts` (Bun test).

### Task 2: Create reusable server-side authorization helpers (AC: 1, 2, 5)

- [x] Add a small set of shared helpers/middleware in `packages/api/src/lib/` to avoid copy/paste role checks, e.g.:
  - [x] `requireProjectMember({ projectId, userId })` → returns member role or throws `ORPCError("FORBIDDEN")`
  - [x] `requireProjectRole({ projectId, userId, allowedRoles })` → owner/admin/member gating
- [x] Standardize `FORBIDDEN` messages (consistent wording for UX toast mapping).

  Implemented in `packages/api/src/lib/authz/project.ts` and validated with Bun unit tests (`*.test.ts`).

### Task 3: Apply authorization helpers to existing project router procedures (AC: 1, 2, 5, 7)

- [x] Refactor `packages/api/src/routers/projects.ts` to use the new helpers for:
  - [x] `projects.get` membership check
  - [x] `projects.update` owner/admin check
  - [x] Any other project-scoped checks introduced later (none yet)

### Task 4: Ensure UI permission gating matches server rules (AC: 6, 8)

- [x] Verify settings UI remains read-only for `member` role and editable only for `owner|admin`.
- [x] Ensure permission errors are surfaced as toasts with clear messaging.

  Verified via `apps/web/src/app/projects/[projectId]/settings/project-settings-content.tsx` and `apps/web/src/components/projects/project-settings/overview-tab.tsx`.

### Task 5: Add regression coverage for authorization (AC: 1, 2, 5)

- [x] Add E2E coverage proving non-members cannot access project settings and members cannot edit settings (extend the existing projects tests pattern).

  Validated by running `bun run test:e2e` against the local dev server.

## Dev Notes

### Developer Context

**Baseline (already implemented in Story 2.1):**
- Project membership lives in `project_members` with `role: "owner" | "admin" | "member"` (`packages/db/src/schema/projects.ts`).
- `projects.list` already returns only projects where the current user is a member (`packages/api/src/routers/projects.ts`).
- `projects.get` already blocks non-members (`FORBIDDEN: You don't have access to this project`).
- `projects.update` already requires `owner` or `admin` membership role.
- UI already uses `project.role` to enforce read-only vs editable project settings (`apps/web/src/app/projects/[projectId]/settings/project-settings-content.tsx`).

**What this story adds (2.2):**
- A consistent, reusable authorization layer for *all* project-scoped operations (current and upcoming stories) so every procedure checks membership/role in the same way and returns consistent `FORBIDDEN` errors.
- A clear permission matrix for project roles to prevent “tribal knowledge” implementation.

**Core security rules (must hold everywhere):**
- Never rely on the UI for security; UI gating is for UX only.
- Every project-scoped procedure must validate membership and required role server-side.
- Users must not be able to list/guess/access other projects’ resources by ID.

### UX Notes (Permission Errors)

- Permission failures should be surfaced via the standard toast pattern with a clear message like: "You don't have permission to [action]. Contact project owner." (see `docs/epics/epic-2-project-workspace-management.md` Story 2.2 UX notes).

### Out of Scope (Implemented in later stories)

- Invitation flow (`2.3`), ownership transfer (`2.4`), deletion (`2.5`) — this story provides the enforcement foundation they will reuse.

### Project Structure Notes

- `packages/api/src/index.ts` provides `protectedProcedure` for auth; story 2.2 should add project authorization helpers/middleware adjacent to routers (e.g. `packages/api/src/lib/...`).
- Keep role checks centralized to avoid copy/paste across routers.

### Architecture Compliance

**Must follow these established patterns:**
- AuthN is enforced via `protectedProcedure` + Better-Auth session in ORPC context (`packages/api/src/index.ts`, `packages/api/src/context.ts`).
- AuthZ is project-scoped: verify membership via `project_members` (`docs/architecture.md` Security Patterns; current implementation already does this in `packages/api/src/routers/projects.ts`).
- Zod validates all ORPC inputs; authorization checks happen **after** auth and **before** the database mutation or sensitive read.
- Use `ORPCError("FORBIDDEN", { message })` for permission denials (this maps cleanly to UX toast messaging).

**Important mismatch to resolve (do not ignore):**
- `docs/architecture.md` describes a global `is_admin` flag for system admins and a `project_members.role` enum of only `owner|member`.
- The current codebase instead models project admin as `project_members.role: "owner" | "admin" | "member"` (`packages/db/src/schema/projects.ts`) and **does not** currently expose a global `is_admin` field on the Better-Auth `user` table (`packages/db/src/schema/auth.ts`).
- For this story: keep authorization logic flexible enough to support *both* a future global admin flag and the existing per-project `admin` role.

**DB guardrails:**
- Membership is authoritative: a user can only access a project if a `project_members` row exists.
- Keep cascade delete behavior intact (FKs already cascade from `projects` → `project_members`).

### Library / Framework Requirements

- **Auth / Session:** Use Better-Auth session from ORPC context (no custom session parsing). See `packages/api/src/context.ts` and `packages/api/src/index.ts`.
- **RPC / Errors:** Use ORPC procedures + `ORPCError` codes (`FORBIDDEN`, `UNAUTHORIZED`, `NOT_FOUND`, `BAD_REQUEST`). Follow the existing pattern in `packages/api/src/routers/projects.ts` and documented error codes in `docs/api-contracts.md`.
- **DB Access:** Use Drizzle via `@planner/db` exports. Authorization helpers should query `project_members` using Drizzle conditions (`and`, `eq`) and return/throw before any sensitive reads/writes.
- **Validation:** Keep inputs validated with Zod at the procedure boundary. Do not add ad-hoc validation deeper in the call chain.
- **Web/UI:** Use existing role gating patterns in `apps/web` (read-only vs editable) and toast error messaging via `sonner`.
- **No new libraries:** This story is enforcement + refactor for consistency; it should not introduce new auth/RBAC dependencies.

### File Structure Requirements

- Create a dedicated, reusable authz helper module for project-scoped authorization in `packages/api/src/lib/` (keep it independent from routers):
  - Suggested path: `packages/api/src/lib/authz/project.ts`
  - It should depend only on `@planner/db` and ORPC error types (no Next.js, no web code).
- Routers should call the helper at the top of each handler, before any sensitive query/mutation.
- Keep permission checks centralized: routers should not re-implement `project_members` lookups inline.
- Ensure helper APIs can support both:
  - current per-project roles (`owner|admin|member` from `project_members.role`)
  - a future global admin concept (mentioned in `docs/architecture.md` but not yet present in DB schema)

### Testing Requirements

- Extend Playwright E2E coverage to explicitly prove authorization boundaries:
  - Non-member cannot load `/projects/[projectId]/settings` (expect `FORBIDDEN` surfaced as UI error state or redirect pattern).
  - Member cannot edit settings (already covered by "member sees read-only settings" in `apps/e2e/tests/projects/projects.spec.ts`).
  - If/when member-management endpoints are added in later stories, add tests asserting only `owner|admin` can mutate membership.
- Prefer E2E coverage for these thin CRUD+DB routers (consistent with Story 2.1 decision); avoid mocked Drizzle unit tests unless there is non-trivial logic.

### Previous Story Intelligence

- Story 2.1 already implemented the core primitives needed for this story:
  - Membership filtering in `projects.list`
  - Membership gating in `projects.get`
  - Owner/admin gating in `projects.update`
  - Read-only UI mode for members in settings (`apps/web/src/components/projects/project-settings/overview-tab.tsx`)
- Reuse patterns from Story 2.1:
  - Throw `ORPCError("FORBIDDEN", { message })` with user-facing messages that can be shown in toasts.
  - Keep DB changes transactional for multi-step operations.
  - Keep shared validation constants in `@planner/api/lib/validation/*` and consume them from web where appropriate.

### Git Intelligence Summary

- Recent work added UI components for member invite, ownership transfer, and project deletion dialogs (see recent `feat(web)` commits).
- This story should ensure backend authorization foundations are strong before wiring those dialogs to real API mutations.

### Project Context Reference

- No `project-context.md` found in this repo. Use `docs/PRD.md`, `docs/architecture.md`, and `docs/epics/epic-2-project-workspace-management.md` as the authoritative context sources.

### Story Completion Status

- Status is `done` after senior dev review.
- Completion note: "Ultimate context engine analysis completed - comprehensive developer guide created".

### References

- [Source: docs/PRD.md#Access Control]
- [Source: docs/epics/epic-2-project-workspace-management.md#Story 2.2: Project Access Control and Permissions]
- [Source: docs/architecture.md]
- [Source: _bmad-output/implementation-artifacts/2-1-project-creation-and-basic-crud.md]
- [Source: _bmad-output/implementation-artifacts/2-0-epic-2-ux-design.md]

## Dev Agent Record

### Agent Model Used

GPT-5.2 (Codex CLI)

### Debug Log References

### Senior Developer Review (AI)

- Date: 2026-01-15
- Outcome: Approve after fixes
- HIGH issues fixed:
  - Removed duplicated E2E assertions in `apps/e2e/tests/projects/projects.spec.ts`
  - Staged the previously untracked `packages/api/src/lib/authz/*` implementation so review matches git reality
- MEDIUM issues fixed:
  - Removed per-call dynamic import from authz path by splitting DB-backed enforcement into `packages/api/src/lib/authz/project.server.ts`
  - Prevented leaking internal permission identifiers to users by mapping permissions → human-readable actions
  - Standardized non-member denial message to include UX guidance ("Contact project owner")
  - Dogfooded `requireProjectRole()` inside `packages/api/src/routers/projects.ts`

### Change Log

- 2026-01-15: Senior developer code review completed; fixes applied; status set to `done`.

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Defined project role permission matrix (`owner`/`admin`/`member`) in `packages/api/src/lib/authz/project.ts` and added Bun unit tests.
- Added reusable server-side authz helpers (`requireProjectMember`, `requireProjectRole`) + standardized forbidden message builder.
- Refactored `packages/api/src/routers/projects.ts` to use the shared authz helpers for membership/role checks.
- Added a Playwright E2E test for non-member project settings access and validated it in the full E2E run.
- Verification after review fixes: `bun run check`, `bun run check-types`, `bun test --cwd packages/api`, and Playwright `apps/e2e/tests/projects/projects.spec.ts -g "non-member cannot access project settings"` with `PLAYWRIGHT_BASE_URL=http://localhost:3001`.
- Note: Workflow validation task file `validate-workflow.xml` was referenced in instructions but was not present under `_bmad/` in this repo; manual consistency checks applied instead.

### File List

- `_bmad-output/implementation-artifacts/2-2-project-access-control-and-permissions.md`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`
- `packages/api/src/lib/authz/project.ts`
- `packages/api/src/lib/authz/project.test.ts`
- `packages/api/src/lib/authz/project.messages.test.ts`
- `packages/api/src/lib/authz/project.require.test.ts`
- `packages/api/src/lib/authz/project.server.ts`
- `packages/api/src/routers/projects.ts`
- `apps/e2e/tests/projects/projects.spec.ts`
