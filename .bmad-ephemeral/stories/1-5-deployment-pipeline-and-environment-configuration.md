# Story 1.5: Deployment Pipeline and Environment Configuration

Status: done (Phase 4 deferred)

## Story

As a developer,
I want automated build and deployment pipeline,
So that we can deploy to production reliably and consistently.

## Requirements Context

This story establishes the CI/CD pipeline and environment configuration for the Planner application, building upon the complete UI shell and theme system from Story 1.4. The goal is to enable automated, reliable deployments with proper quality gates (linting, type checking, testing, building) enforced on every PR and branch push, with self-hosted deployment via Dokploy supporting preview deployments for PRs and production deployment from main branch.

**Business Context:**
- Automated deployment reduces human error and deployment friction
- Quality gates (lint, type check, test) enforce code quality on every PR
- Preview deployments enable testing changes in realistic environment before merge
- Self-hosted deployment provides control over infrastructure costs and data
- Documented deployment process enables team scalability

**Technical Requirements:**
From [docs/epics/epic-1-foundation-project-infrastructure.md#Story-1.5]:
- CI/CD pipeline triggered on **all PRs and branch pushes** (not just main)
- Pipeline stages: Linting (Ultracite/Biome), Type checking, Unit tests, Production build, Docker build
- Environment configuration for development, staging, production
- Environment variable validation at startup
- Optimized production builds (Docker image with Next.js standalone mode)
- Self-hosted deployment via Dokploy (NOT Vercel)

**Architecture Constraints:**
From [docs/architecture.md#Core-Technologies]:
- Next.js 16.0.0 with App Router and standalone output mode for Docker
- Turborepo 2.5.4 monorepo build orchestration
- Bun 1.3.1 package manager and runtime
- TypeScript 5.x strict mode
- Ultracite 6.3.2 + Biome 2.3.4 for linting/formatting
- PostgreSQL database (self-hosted or managed service)
- Better-Auth 1.3.28 for authentication

**Existing Foundation:**
From Story 1.4 completion:
- Complete UI shell with Balanced Teal theme
- Authentication system fully operational
- All code passes `bun run check` with 0 errors
- TypeScript strict mode enforced
- shadcn/ui component library integrated

**Gradual Implementation Approach:**
This story follows a phased approach where each phase is researched, implemented, and verified before moving to the next:
1. **Phase 1**: Basic CI (lint, typecheck, test, build) - research → user approval → implement → verify
2. **Phase 2**: Docker integration (Dockerfile, build, push to registry) - research → user approval → implement → verify
3. **Phase 3**: Dokploy preview deployments for PRs - research → user approval → implement → verify
4. **Phase 4**: Dokploy production deployment from main - research → user approval → implement → verify
5. **Phase 5**: Dependency management bots (optional) - research → user approval → implement → verify

## Project Structure Alignment

### Learnings from Previous Story

**From Story 1-4-basic-ui-shell-and-theme-system (Status: review)**

**Complete UI Foundation Established:**
- Fixed header with Planner branding (Teal gradient logo)
- Top navigation (Board, Projects, Reports) with active state highlighting
- User menu with avatar showing user initials
- Theme system with light/dark mode toggle and localStorage persistence
- Smooth 200ms theme transitions
- Responsive layout (mobile hamburger menu, desktop full navigation)
- Full keyboard navigation and WCAG 2.1 AA accessibility
- Better Auth UI integration for sign-in/sign-up flows

**Design System and Code Quality:**
- Balanced Teal theme (Primary: #14b8a6, Secondary: #6b7280) using OKLCH colors
- All design tokens implemented via shadcn/ui CSS variables
- All code passes `bun run check` with 0 errors
- TypeScript strict mode enforced globally
- Ultracite 6.3.2 + Biome 2.3.4 linting active
- No accessibility issues found via browser DevTools

**Project Architecture:**
- Turborepo monorepo with multiple packages
- Next.js 16 App Router in `apps/web/`
- Existing packages: `@repo/api` (ORPC), `@repo/auth` (Better-Auth), `@repo/db` (Drizzle)
- Bun workspaces for package management
- PostgreSQL database with Drizzle ORM

**Build Scripts Already Available:**
- `bun run check` - Runs Ultracite/Biome linting (currently passing with 0 errors)
- TypeScript compilation via `tsc --noEmit` likely available
- Next.js production build via `next build` in apps/web
- Turborepo build orchestration via `turbo build`

**Key Takeaways for This Story:**
- BUILD on existing `bun run check` script - pipeline already validates code quality
- VERIFY TypeScript build command exists or create it
- ENSURE production build works with current codebase
- CREATE Dockerfile for Next.js with standalone output mode
- CREATE Docker build and registry push stages
- ESTABLISH Dokploy integration for preview and production deployments
- RESEARCH Dokploy features thoroughly (preview environments, zero-downtime deployments, health checks)
- DOCUMENT all research findings before implementation
- VERIFY each phase works before moving to next

[Source: .bmad-ephemeral/stories/1-4-basic-ui-shell-and-theme-system.md#Dev-Agent-Record]

### Expected File Paths

Based on architecture and Turborepo monorepo structure:

```
planner/
├── .github/
│   └── workflows/
│       └── ci.yml                        # GitHub Actions CI/CD pipeline (TO CREATE)
├── .bmad-ephemeral/
│   └── stories/
│       ├── 1-5-deployment-pipeline-and-environment-configuration.md (this story)
│       └── 1-5-research/
│           ├── phase-1-ci-pipeline.md          # Research findings Phase 1 (TO CREATE)
│           ├── phase-2-docker.md               # Research findings Phase 2 (TO CREATE)
│           ├── phase-3-preview-deployments.md  # Research findings Phase 3 (TO CREATE)
│           ├── phase-4-production.md           # Research findings Phase 4 (TO CREATE)
│           └── phase-5-dependencies.md         # Research findings Phase 5 (TO CREATE)
├── apps/
│   └── web/
│       ├── .env.example                  # Environment variable template (TO CREATE)
│       ├── .env.local                    # Local development env (exists)
│       ├── Dockerfile                    # Next.js Docker image (TO CREATE)
│       ├── .dockerignore                 # Docker ignore file (TO CREATE)
│       ├── next.config.ts                # Next.js config (exists - verify standalone output)
│       └── package.json                  # Build scripts (exists - verify)
├── packages/
│   ├── api/
│   │   └── package.json                  # Verify build scripts
│   ├── auth/
│   │   └── package.json                  # Verify build scripts
│   └── db/
│       └── package.json                  # Verify build scripts
├── turbo.json                            # Turborepo pipeline config (exists - verify)
├── package.json                          # Root package.json with scripts (exists - verify)
└── README.md                             # Deployment documentation section (TO UPDATE)
```

**Deployment Configuration Files:**
- Dokploy configuration (TBD after research - may be UI-based, not file-based)
- Docker registry credentials (GitHub Actions secrets)
- Environment variables for preview and production (Dokploy configuration)

**Environment Variables to Document:**
From existing `.env.local` and architecture requirements:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Better-Auth session secret
- `BETTER_AUTH_URL` - Application URL for auth redirects
- `NODE_ENV` - Environment identifier (development, staging, production)
- Any additional secrets for future features

## Acceptance Criteria

1. **CI/CD pipeline runs on all PRs and branch pushes**
   - Given code is pushed to any branch or PR is created
   - When GitHub Actions workflow triggers
   - Then the pipeline executes all quality gate stages
   - And the pipeline fails if any stage returns non-zero exit code
   - And pipeline status is visible in PR checks

2. **Linting stage enforces code quality**
   - Given the CI pipeline is running
   - When the linting stage executes
   - Then it runs `bun run check` (Ultracite/Biome)
   - And fails the build if any linting errors are found
   - And displays clear error messages for failures

3. **Type checking stage validates TypeScript**
   - Given the linting stage passed
   - When the type checking stage executes
   - Then it runs TypeScript compiler in check mode
   - And fails the build if any type errors are found
   - And displays type error locations and messages

4. **Production build creates Docker image**
   - Given all quality gates (lint, type check) passed
   - When the Docker build stage executes
   - Then it builds Next.js in standalone mode
   - And creates optimized Docker image
   - And pushes image to registry with appropriate tags
   - And main branch gets production tag, PRs get preview tags

5. **Environment configuration supports dev/staging/prod**
   - Given I am deploying to different environments
   - When I configure environment variables
   - Then development uses `.env.local` file
   - And preview deployments use Dokploy preview environment variables
   - And production uses Dokploy production environment variables
   - And `.env.example` documents all required variables

6. **Environment variable validation runs at startup**
   - Given the application starts in any environment
   - When environment variables are missing or invalid
   - Then the application fails fast with clear error messages
   - And logs which variables are missing/invalid
   - And prevents deployment with misconfigured environment

7. **Docker image is optimized**
   - Given the Docker build completes
   - Then image uses multi-stage build for minimal size
   - And only production dependencies are included
   - And Next.js standalone output is used
   - And image size is reasonable (< 500MB)
   - And image starts up quickly (< 10 seconds)

8. **Preview deployments work for PRs**
   - Given a PR is created or updated
   - When Docker image is built and pushed
   - Then Dokploy creates preview deployment with unique URL
   - And preview URL is accessible and functional
   - And preview deployment uses preview environment variables
   - And preview is cleaned up when PR is closed/merged

9. **Integration tests run on preview deployments**
   - Given a PR preview deployment is live
   - When integration tests execute against the preview URL
   - Then tests verify authentication flows, API endpoints, database connectivity
   - And test results are reported back to the PR
   - And deployment is marked as verified or failed

10. **Production deployment works from main branch**
    - Given code is merged to main branch
    - When Docker image is built with production tag
    - Then Dokploy deploys to production environment
    - And deployment uses zero-downtime strategy
    - And health checks verify deployment success
    - And rollback is possible if deployment fails

11. **Deployment process is documented**
    - Given I am a new team member
    - When I read the README.md deployment section
    - Then I understand how CI/CD pipeline works
    - And I understand how preview deployments work
    - And I understand how production deployments work
    - And I know which environment variables are required
    - And I know how to verify deployment succeeded

[Source: docs/epics/epic-1-foundation-project-infrastructure.md#Story-1.5]

## Tasks / Subtasks

**⚠️ CRITICAL: Research-First Pattern with Human Verification**

This story uses a **gradual improvement pattern** where each phase is researched, documented, verified by human, and only then implemented. Do NOT implement anything before completing research tasks AND getting user approval for that phase.

**Execution Instructions:**
1. Complete ALL research tasks for current phase
2. Document findings in phase research file (`.bmad-ephemeral/stories/1-5-research/phase-X-*.md`)
3. **STOP and present findings to user**
4. Wait for user approval/feedback/direction change
5. Update task list with implementation tasks based on approved research
6. Implement phase tasks
7. VERIFY phase works (test in real PR/deployment)
8. Mark phase complete, move to next phase
9. Repeat

---

### Phase 1: Basic CI Pipeline

**RESEARCH TASKS (DO THESE FIRST):**

- [x] **RESEARCH: GitHub Actions patterns for Bun monorepos**
  - [x] Search for latest GitHub Actions best practices for Bun projects (2024-2025)
  - [x] Find official Bun GitHub Action (oven-sh/setup-bun) and latest version
  - [x] Research Turborepo caching in GitHub Actions
  - [x] Research workflow triggers (push, pull_request, workflow_dispatch)
  - [x] Research concurrency groups for canceling outdated runs
  - [x] Document findings with sources in research file

- [x] **RESEARCH: Lint/typecheck/test/build workflow**
  - [x] Research best practices for sequential vs parallel job execution
  - [x] Research caching strategies for node_modules and build outputs
  - [x] Research error reporting and annotations in GitHub Actions
  - [x] Research timeout configurations for each stage
  - [x] Research fail-fast strategies (stop on first failure vs run all)
  - [x] Document recommended workflow structure

- [x] **RESEARCH: Caching strategies for faster CI runs**
  - [x] Research Bun lock file caching (bun.lockb)
  - [x] Research Turborepo remote caching options (Vercel, GitHub Actions cache)
  - [x] Research GitHub Actions cache size limits and eviction policies
  - [x] Research cache invalidation strategies (when to bust cache)
  - [x] Research cache hit rate monitoring
  - [x] Document optimal caching configuration

**⚠️ MANDATORY PAUSE POINT:**

- [x] **STOP: Document and present Phase 1 research findings**
  - [x] Create `.bmad-ephemeral/stories/1-5-research/phase-1-ci-pipeline.md`
  - [x] Document all findings with sources, recommendations, trade-offs
  - [x] Present summary to user with link to full research document
  - [x] **WAIT for user approval/feedback before proceeding**
  - [x] Update research document with user feedback if any
  - [x] Mark research as "Approved" only after user confirms
  - [x] Proceed to implementation ONLY after approval

**IMPLEMENTATION TASKS:**

- [x] Create `.github/workflows/ci.yml` file with sequential verify job
- [x] Verify `check-types` script exists in package.json
- [x] Document CI pipeline in README
- [x] Commit and push Phase 1 implementation (commit 9ccf37a)

**VERIFICATION:**

- [x] Pipeline triggered on push to main (commit 9ccf37a)
- [ ] Verify pipeline passes all steps (in progress - check GitHub Actions)
- [ ] Create test PR with clean code - verify pipeline passes
- [ ] Create test PR with lint error - verify pipeline fails at lint stage
- [ ] Create test PR with type error - verify pipeline fails at typecheck stage
- [ ] Verify caching works (second run should be faster)
- [ ] Mark Phase 1 COMPLETE before moving to Phase 2

---

### Phase 2: Docker Integration

**RESEARCH TASKS (DO THESE FIRST):**

- [x] **RESEARCH: Next.js 16 Dockerfile best practices**
  - [x] Research Next.js standalone output mode configuration (next.config.ts)
  - [x] Research official Next.js Docker examples (latest 2024-2025)
  - [x] Research Node.js vs Bun as Docker base image (compatibility, size, performance)
  - [x] Research production security hardening (non-root user, minimal base image)
  - [x] Research health check endpoint implementation
  - [x] Document recommended Dockerfile structure

- [x] **RESEARCH: Multi-stage Docker builds**
  - [x] Research build stage optimization (deps → build → production)
  - [x] Research layer caching for faster builds
  - [x] Research image size optimization techniques (Alpine vs Distroless)
  - [x] Research .dockerignore best practices (what to exclude)
  - [x] Research build args vs environment variables
  - [x] Document multi-stage build strategy

- [x] **RESEARCH: Docker registry integration with Dokploy**
  - [x] Research if Dokploy has built-in Docker registry
  - [x] Research using GitHub Container Registry (GHCR) with Dokploy
  - [x] Research using Docker Hub with Dokploy
  - [x] Research private registry options (Harbor, etc.) with Dokploy
  - [x] Research authentication methods for each registry option
  - [x] Research tagging strategies (latest, git SHA, semver, PR number)
  - [x] Research registry storage limits and cleanup policies
  - [x] Document recommended registry and tagging approach

- [x] **RESEARCH: Docker layer caching in GitHub Actions**
  - [x] Research docker/build-push-action latest version (v6 as of 2025)
  - [x] Research docker/setup-buildx-action latest version (v3)
  - [x] Research docker/login-action latest version (v3)
  - [x] Research docker/metadata-action latest version (v5)
  - [x] Research BuildKit cache backends (inline, registry, gha)
  - [x] Research cache size and performance tradeoffs
  - [x] Research cache scoping (per-branch vs global)
  - [x] Document recommended caching strategy

- [x] **RESEARCH: Build-reuse pattern vs Docker-in-Docker**
  - [x] Analyze existing CI caching (Bun + Turborepo)
  - [x] Research Turborepo cache in Docker builds
  - [x] Research turbo prune --docker pattern
  - [x] Compare multi-stage Docker vs reusing CI build artifacts
  - [x] Document performance and complexity trade-offs

- [x] **RESEARCH: Docker tagging strategy**
  - [x] Research preview deployment tagging (pr-XX)
  - [x] Research rollback tagging (sha-XXXXXX)
  - [x] Research production vs staging vs preview distinction
  - [x] Discuss with user: Avoid `latest` confusion
  - [x] Document simplified preview-focused strategy

- [x] **RESEARCH: Workflow DRY principles**
  - [x] Identify duplicated setup steps in CI workflow
  - [x] Research GitHub Actions composite actions
  - [x] Research reusable workflows
  - [x] Document composite action approach

**⚠️ MANDATORY PAUSE POINT:**

- [x] **STOP: Document and present Phase 2 research findings**
  - [x] Create `.bmad-ephemeral/stories/1-5-research/phase-2-docker.md`
  - [x] Document all findings with sources, recommendations, trade-offs
  - [x] Present summary to user with link to full research document
  - [x] **WAIT for user approval/feedback before proceeding**
  - [x] Update research document with user feedback if any
  - [x] Mark research as "Approved" only after user confirms
  - [x] Proceed to implementation ONLY after approval

**IMPLEMENTATION TASKS:**

- [x] **Create reusable composite action**
  - [x] Create `.github/actions/setup-bun-workspace/action.yml`
  - [x] Implement Bun setup step (oven-sh/setup-bun@v2, version 1.3.1)
  - [x] Implement Bun cache step (actions/cache@v4, path: ~/.bun/install/cache)
  - [x] Implement Turborepo cache step (rharkor/caching-for-turbo@v2.3.2)
  - [x] Implement install dependencies step (bun install --frozen-lockfile)
  - [x] Add bun-version input parameter (default: 1.3.1)
  - [x] Add shell: bash to all steps (required for composite actions)

- [x] **Update Next.js configuration for standalone output**
  - [x] Open `apps/web/next.config.ts`
  - [x] Add `output: 'standalone'` to nextConfig
  - [x] Verify no breaking changes to existing config

- [x] **Create Dockerfile (single-stage runtime)**
  - [x] Create `apps/web/Dockerfile`
  - [x] Base image: `FROM oven/bun:1.3.1-slim AS runner`
  - [x] Set working directory: `WORKDIR /app`
  - [x] Set environment variables: NODE_ENV=production, NEXT_TELEMETRY_DISABLED=1, HOSTNAME=0.0.0.0, PORT=3000
  - [x] Create non-root user: addgroup nodejs (GID 1001), adduser nextjs (UID 1001)
  - [x] Copy .next/standalone with chown (--chown=nextjs:nodejs)
  - [x] Copy .next/static with chown (--chown=nextjs:nodejs)
  - [x] Note: No public folder in this app, skipped

- [x] **Create .dockerignore file**
  - [x] Create `apps/web/.dockerignore`
  - [x] Exclude .next/* but include .next/standalone and .next/static (whitelist pattern)
  - [x] Exclude: node_modules, .turbo, dist, build, out
  - [x] Exclude: .env* (except .env.example)
  - [x] Exclude: .git, .gitignore, .github, .bmad*, .claude
  - [x] Exclude: .vscode, .idea
  - [x] Exclude: *.md, docs
  - [x] Exclude: *.log files
  - [x] Exclude: .DS_Store, Thumbs.db

- [x] **Update GitHub Actions workflow**
  - [x] Update `.github/workflows/ci.yml`
  - [x] Replace duplicated setup steps in `verify` job with composite action
  - [x] Replace duplicated setup steps in `docker-build` job with composite action
  - [x] Add `docker-build` job permissions: contents: read, packages: write
  - [x] Add docker-build needs: verify
  - [x] Add setup-buildx step (docker/setup-buildx-action@v3)
  - [x] Add login step (docker/login-action@v3, registry: ghcr.io, use GITHUB_TOKEN)
  - [x] Add metadata step (docker/metadata-action@v5, tags: pr-XX, sha-XXXXXX)
  - [x] Add image-tag output determination step
  - [x] Add build-push step (docker/build-push-action@v6)
  - [x] Configure context: ./apps/web, file: ./apps/web/Dockerfile
  - [x] Configure cache: type=gha, scope=planner-web, mode=max
  - [x] Configure push: true, tags/labels from metadata
  - [x] Remove debug steps after successful CI runs

- [x] **Update .env.example**
  - [x] Open `apps/web/.env.example`
  - [x] Add/verify DATABASE_URL with comment and format explanation
  - [x] Add/verify BETTER_AUTH_SECRET with comment
  - [x] Add/verify BETTER_AUTH_URL with comment and environment examples
  - [x] Add/verify CORS_ORIGIN with comment
  - [x] Add NODE_ENV with comment (optional, auto-set in production)

**VERIFICATION:**

- [x] **Local Docker testing**
  - [x] Build app locally: `bun run build` ✅ Success (10.4s)
  - [x] Verify standalone output exists: `ls apps/web/.next/standalone/` ✅ Confirmed
  - [x] Build Docker image: `docker build -t planner:test apps/web` ✅ Success
  - [x] Run container: `docker run -p 3000:3000 --env-file apps/web/.env planner:test` ✅ Success
  - [x] Verify app accessible at http://localhost:3000 ✅ Working (redirects to /auth/sign-in)
  - [x] Check image size: `docker images planner:test` ✅ 255MB (slightly above 200MB target, acceptable)
  - [x] Verify non-root user: `docker exec <container> whoami` ✅ Running as `nextjs`
  - [x] Verify app starts quickly ✅ Ready in 42ms
  - [x] Stop and remove container ✅ Cleanup complete

- [x] **CI workflow testing**
  - [x] Commit and push Phase 2 implementation ✅ Multiple commits (debugging, fixes, cleanup)
  - [x] Verify `verify` job passes (lint, typecheck, build) ✅ Passing
  - [x] Verify `docker-build` job passes ✅ Passing
  - [x] Check workflow logs for Turbo cache hit ✅ Cache working
  - [x] Check workflow logs for Docker cache usage ✅ GHA cache working
  - [x] Verify build time is fast (<2 min for docker-build job) ✅ ~30 seconds total
  - [x] Cleanup debug steps from CI workflow ✅ Removed all debug artifacts

- [x] **GHCR verification**
  - [x] Verify image pushed successfully ✅ Confirmed in logs (sha-ef82a9a)
  - [x] Verify tags created: `sha-<hash>` ✅ Tag: ghcr.io/vleletko/planner:sha-ef82a9a
  - [x] Verify image exported and pushed to registry ✅ Push completed in 8.2s
  - [x] Verify Docker layer cache exported to GHA ✅ Cache exported (18.4s)

- [x] **Caching verification**
  - [x] Verify Bun cache hit in CI logs ✅ Working
  - [x] Verify Turbo cache hit in CI logs ✅ Build instant on cache hit
  - [x] Verify Docker GHA cache working ✅ Cache scope: planner-web, mode: max

- [x] **Documentation review**
  - [x] README has Docker deployment section ✅ Comprehensive documentation added
  - [x] Environment variables documented clearly ✅ .env.example updated with comments
  - [x] Build commands documented ✅ Local and CI build processes documented
  - [x] Troubleshooting section added ✅ Common issues and solutions documented

- [x] **Final checklist**
  - [x] All implementation tasks completed ✅ 100% complete
  - [x] All verification tests passed ✅ Local and CI tests passing
  - [x] Image size acceptable (255MB, slightly above 200MB target but production-ready) ✅
  - [x] CI performance excellent (<2 min total) ✅ ~30 seconds for docker-build
  - [x] Documentation complete ✅ README and .env.example updated
  - [x] CI workflow cleaned of debug artifacts ✅ Production-ready
  - [x] **Phase 2 COMPLETE** ✅ Ready to move to Phase 3

---

### Phase 3: Dokploy Preview Deployments

**RESEARCH TASKS (DO THESE FIRST):**

- [x] **RESEARCH: Dokploy preview environments feature**
  - [x] Research Dokploy documentation for preview environments
  - [x] Research how Dokploy preview environments work
  - [x] Research Dokploy GitHub integration (automatic PR detection)
  - [x] Research preview environment configuration options
  - [x] Research preview URL generation (subdomain vs path-based)
  - [x] Research SSL certificate handling for preview URLs (Let's Encrypt auto)
  - [x] Research preview resource limits (CPU, memory, storage)
  - [x] Document Dokploy preview environments capabilities
  - [x] **KEY FINDING:** Native preview deployments don't work with Docker Compose (Issue #2028)
  - [x] **KEY FINDING:** Native preview deployments rebuild on server (bypasses CI/CD)
  - [x] **DECISION:** Use Docker Compose API instead of native preview feature

- [x] **RESEARCH: Dokploy Docker Compose API**
  - [x] Research Docker Compose API endpoints (create, update, deploy, delete)
  - [x] Research sourceType modes (git vs raw)
  - [x] Research compose file handling (string vs repository)
  - [x] Research environment variable interpolation
  - [x] Research API authentication (x-api-key header)
  - [x] Document API request/response formats

- [x] **RESEARCH: Dokploy preview environment lifecycle**
  - [x] Research manual lifecycle management via API
  - [x] Research deployment status polling
  - [x] Research health check integration
  - [x] Research cleanup strategies
  - [x] Document lifecycle management approach

- [x] **RESEARCH: Dokploy GitHub Actions integration**
  - [x] Research Dokploy API for GitHub Actions integration
  - [x] Research posting preview URLs to PR comments
  - [x] Research reusing existing docker-build job (NO REBUILD)
  - [x] Document recommended integration approach

- [x] **RESEARCH: Dokploy preview environment database options**
  - [x] Research separate database per preview environment (isolated testing)
  - [x] Research shared staging database for all previews (cost savings)
  - [x] Research database cleanup strategies
  - [x] **DECISION:** Use isolated PostgreSQL per preview (complete isolation)
  - [x] Document recommended database strategy

- [x] **RESEARCH: Dokploy environment variables management**
  - [x] Research how secrets are managed in Dokploy (project-level)
  - [x] Research environment-specific variables (preview vs production)
  - [x] Research environment variable templates/inheritance
  - [x] Research variable interpolation in compose files
  - [x] Document environment variable management approach

- [x] **RESEARCH: Running integration tests on preview deployments**
  - [x] Research waiting for Dokploy deployment to be ready
  - [x] Research health check endpoints for readiness
  - [x] Research smoke test strategies (basic validation)
  - [x] Document integration test strategy

- [x] **RESEARCH: Docker Compose best practices verification**
  - [x] Research Dokploy docker-compose recommendations
  - [x] Verify ports vs expose directive
  - [x] Verify network configuration (dokploy-network)
  - [x] Verify Traefik label requirements
  - [x] Verify volume path patterns (../files/)
  - [x] Document required fixes

- [x] **RESEARCH: CI workflow integration verification**
  - [x] Analyze existing .github/workflows/ci.yml
  - [x] Verify docker-build job image tags (pr-42, sha-abc123)
  - [x] Verify image registry alignment (ghcr.io/vleletko/planner)
  - [x] Verify no rebuild needed (reuse existing docker-build output)
  - [x] Document integration approach

**⚠️ MANDATORY PAUSE POINT:**

- [x] **STOP: Document and present Phase 3 research findings**
  - [x] Create `.bmad-ephemeral/stories/1-5-research/phase-3-preview-deployments.md`
  - [x] Document all findings with sources, recommendations, trade-offs
  - [x] Present summary to user with link to full research document
  - [x] **WAIT for user approval/feedback before proceeding**
  - [x] Update research document with user feedback if any
  - [x] Mark research as "Approved" only after user confirms
  - [x] **APPROVED by user (2025-11-18)** ✅
  - [x] Proceed to implementation

**IMPLEMENTATION TASKS (ADD AFTER USER APPROVAL):**

**Task 1: Fix docker-compose best practices** (15 min) ✅
- [x] Change `ports: - "${WEB_PORT:-3000}"` to `expose: - 3000` (line 15-16)
- [x] Add `expose: - 5432` to db service (after line 68)
- [x] Remove `WEB_PORT` from `.dokploy/scripts/create-preview.sh` (line 218)
- [x] Remove `WEB_PORT` from `.dokploy/scripts/update-preview.sh` (line 131)

**Task 2: Create health check endpoint** (30 min) ✅
- [x] Create `apps/web/app/api/health/route.ts`
- [x] Return 200 OK with `{ status: 'ok', timestamp, environment, version }`
- [x] Enhanced with timestamp, environment, and version fields
- [x] Fixed linting error (removed unnecessary async)

**Task 3: Add preview-deploy job to CI** (1 hour) ✅
- [x] Edit `.github/workflows/ci.yml`
- [x] Add `preview-deploy` job after `docker-build` job
- [x] Add `needs: docker-build` (wait for image)
- [x] Add `if: github.event_name == 'pull_request'` (PRs only)
- [x] Call `.dokploy/scripts/create-preview.sh` or `update-preview.sh`
- [x] Add smoke tests (curl /health)
- [x] Add GitHub deployment tracking with environment URL
- [x] Update deployment status (success/failure)

**Task 4: Create preview-cleanup workflow** (30 min) ✅
- [x] Consolidated into `.github/workflows/ci.yml` (runs on PR close)
- [x] Trigger on `pull_request: types: [closed]`
- [x] Call `.dokploy/scripts/delete-preview.sh`
- [x] Deactivate GitHub deployment by searching statuses

**Task 5: Configure Dokploy** (1 hour) ✅
- [x] Set project-level secrets: `DB_PASSWORD`, `BETTER_AUTH_SECRET`
- [x] Verify GHCR registry configured with GitHub PAT token
- [x] Verified via PR #2 deployment (working correctly)

**Task 6: Configure GitHub Secrets** (15 min) ✅
- [x] Add `DOKPLOY_URL`
- [x] Add `DOKPLOY_API_TOKEN`
- [x] Add `DOKPLOY_PROJECT_ID`
- [x] Add `APP_BASE_DOMAIN`

**Task 7: DNS Configuration** (30 min) ✅
- [x] Configure wildcard A record: `*.preview.example.com` → Dokploy server IP
- [x] Verify DNS propagation working
- [x] SSL certificate generation working (via Traefik/Let's Encrypt)

**Task 8: Documentation** (1 hour) ✅
- [x] Update README with comprehensive preview deployment section
- [x] Document prerequisites (Dokploy, DNS, secrets)
- [x] Document manual testing (scripts usage)
- [x] Document troubleshooting (common issues)
- [x] Document architecture and workflow configuration

**VERIFICATION:**

- [x] Create test PR with clean code (PR #2)
- [x] Verify CI passes (verify → docker-build → preview-deploy) ✅
- [x] Verify preview deployment created in Dokploy ✅
- [x] Verify preview URL accessible and HTTPS working ✅
- [x] Verify smoke tests pass ✅
- [x] Verify GitHub deployment created with environment URL ✅
- [ ] Verify PR comment posted with preview URL (if implemented)
- [x] Push update to PR (linting fix pushed) ✅
- [x] Verify preview updated (not recreated) ✅
- [x] Verify URL remains same after update ✅
- [x] Test PR close/merge cleanup ✅
- [x] Verify preview deleted from Dokploy ✅
- [x] Verify GitHub deployment deactivated ✅
- [x] Verify no orphaned deployments ✅
- [x] Mark Phase 3 COMPLETE ✅

**VERIFIED WORKING (2025-11-19):**
- ✅ Deployment creation working correctly
- ✅ Cleanup workflow working correctly
- ✅ GitHub deployment tracking working
- ✅ Health check endpoint responding
- ✅ Single environment, multiple PRs pattern validated
- ✅ Auto-inactive deployment marking working

---

### Phase 3.5: Database Migrations & Seeding ✅ COMPLETE

**Status:** Complete (2025-12-05)
**PR:** #5 - feat: add migrate app for database migrations and seeding

#### Problem Statement

Preview deployments create isolated PostgreSQL databases that start **empty**. Each preview needs:
1. Database schema (migrations) - Create tables, indexes, constraints
2. Seed data (test users) - Make preview functional for QA testing

Without migrations and seeding, preview environments are non-functional.

---

#### Architecture Decision: Separate Migration App

After investigating multiple approaches (Next.js instrumentation, Dockerfile hacks, CI exec), we decided on:

**✅ Dedicated migration app in monorepo: `apps/migrate`**

**Rationale:**
- Clean separation of concerns (schema vs operations)
- No file copying hacks (SQL files are where they're used)
- Works for both preview AND production (unified approach)
- Build system handles dependencies naturally
- Self-contained, explicit purpose

**Structure:**
```
packages/db/              # Schema definitions ONLY
  └── src/
      ├── index.ts        # DB connection, helpers
      └── schema/         # TypeScript schema definitions

apps/migrate/             # Database operations (migrations + seeding)
  ├── package.json
  ├── drizzle.config.ts   # Points to ../packages/db/schema
  ├── Dockerfile
  └── src/
      ├── index.ts        # Main entry point
      ├── reset.ts        # Database reset logic
      ├── migrations/     # Generated SQL files (from drizzle-kit)
      └── seed/           # Seeding logic
          ├── index.ts
          ├── users.ts    # Core seed functions
          └── test.ts     # Test profile data
```

---

#### Seeding Profile System

**Profiles:**
- `none` - Production (no seeding, preserve data)
- `test` - Everything else (dev, preview, e2e - same dataset)

**Key Insight:** Preview and E2E can use THE SAME test data. No need for separate profiles.

**Test Dataset Includes:**
- 4 test users (verified + unverified scenarios)
- Sample projects (makes app look realistic)
- Sample tasks (enables workflow testing)

**Environment Variables:**
- `SEED_PROFILE` - Which profile to use (`none` or `test`)
- `RESET_DB` - Whether to reset database before seeding (`true` or `false`)

---

#### Database Reset Strategy

**Problem:** Without reset, seeding can fail after schema changes (incompatible data, duplicates)

**Solution:** Reset database in ephemeral environments before seeding

**Reset Matrix:**

| Environment | RESET_DB | SEED_PROFILE | Behavior |
|-------------|----------|--------------|----------|
| Production  | `false`  | `none`       | Migrations only, preserve all data |
| Staging     | `false`  | `none`       | Migrations only, preserve all data |
| Preview     | `true`   | `test`       | Reset → Migrate → Seed test data |
| E2E         | `true`   | `test`       | Reset → Migrate → Seed test data |
| Dev (local) | `true`/`false` | `test` | Optional reset, seed test data |

**Safety Mechanisms:**
- Prevent accidental production reset (error if `RESET_DB=true` with `SEED_PROFILE=none`)
- Explicit flags make intent clear
- Warning if running test seed without reset

---

#### Migration App Flow

```
1. Safety checks (prevent production reset)
2. Reset database (if RESET_DB=true)
   └─ Drop all tables in public schema
3. Run migrations (always)
   └─ Execute SQL files from src/migrations/
4. Run seeding (if SEED_PROFILE != 'none')
   └─ Seed test users and sample data
5. Exit (success or failure)
```

---

#### Docker Compose Integration

**Preview deployments:**
```yaml
services:
  migrate:
    image: ghcr.io/${GITHUB_REPO}/migrate:${IMAGE_TAG}
    environment:
      - DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/planner
      - SEED_PROFILE=test
      - RESET_DB=true
    restart: "no"  # Run once and exit
    depends_on:
      db:
        condition: service_healthy

  web:
    depends_on:
      migrate:
        condition: service_completed_successfully
```

**Production deployments:**
```yaml
services:
  migrate:
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SEED_PROFILE=none
      - RESET_DB=false
```

---

#### Workflow Updates

**Drizzle Kit Workflow (generating migrations):**
```bash
# 1. Edit schema in packages/db/src/schema/
# 2. Generate migration
cd apps/migrate
drizzle-kit generate

# 3. SQL files created in apps/migrate/src/migrations/
# No copying needed!
```

**Root Scripts:**
```json
{
  "db:generate": "turbo -F migrate generate",
  "db:migrate": "turbo -F migrate migrate",
  "db:seed": "turbo -F migrate seed",
  "db:reset": "RESET_DB=true SEED_PROFILE=test turbo -F migrate migrate"
}
```

**Local Development:**
```bash
bun run db:reset      # Fresh start with test data
bun run db:migrate    # Just run migrations
bun run db:seed       # Add seed data to existing DB
```

---

#### CI/CD Updates

**Build both images:**
```yaml
jobs:
  docker-build:
    steps:
      # Build web image (existing)
      - name: Build web image
        uses: docker/build-push-action@v6
        with:
          context: ./apps/web
          file: ./apps/web/Dockerfile
          tags: ghcr.io/${{ github.repository }}:${IMAGE_TAG}

      # Build migrate image (NEW)
      - name: Build migrate image
        uses: docker/build-push-action@v6
        with:
          context: .  # Root context (includes workspace)
          file: ./apps/migrate/Dockerfile
          tags: ghcr.io/${{ github.repository }}/migrate:${IMAGE_TAG}
```

---

#### Implementation Tasks

**Task 1: Create migrate app structure** ✅ COMPLETE
- [x] Create `apps/migrate/package.json`
- [x] Create `apps/migrate/drizzle.config.ts`
- [x] Create `apps/migrate/src/index.ts` (entry point with dotenv loading)
- [x] Create `apps/migrate/tsconfig.json`
- [x] Create `apps/migrate/.env.example`
- [x] Add workspace dependency on `@planner/db`

**Task 2: Implement database reset** ✅ COMPLETE
- [x] Create `apps/migrate/src/reset.ts`
- [x] Implement schema drop/recreate logic (drops all tables in public schema)
- [x] Add safety checks (prevent production reset: error if RESET_DB=true with SEED_PROFILE=none)

**Task 3: Move migrations to migrate app** ✅ COMPLETE
- [x] Create drizzle.config.ts pointing to packages/db/schema
- [x] Copy existing migrations from `packages/db/src/migrations/`
- [x] Migrations now in `apps/migrate/src/migrations/`

**Task 4: Implement seed profiles** ✅ COMPLETE
- [x] Create `apps/migrate/src/seed/index.ts` (profile orchestration)
- [x] Create `apps/migrate/src/seed/test.ts` (test user data)
- [x] Implement profile logic (none vs test)
- [x] Password hashing using Node.js crypto scrypt (Better Auth compatible)
  - Format: `${salt}:${hash}` with N=16384, r=16, p=1, dkLen=64, maxmem=67MB

**Task 5: Create Dockerfile** ✅ COMPLETE
- [x] Create `apps/migrate/Dockerfile`
- [x] Uses `oven/bun:1.3.1-slim` base image
- [x] Copies workspace packages (db + migrate)
- [x] Set CMD to run src/index.ts

**Task 6: Update docker-compose configs** ✅ COMPLETE
- [x] Update `.dokploy/docker-compose.preview.yml` with migrate service
- [x] Set SEED_PROFILE=test, RESET_DB=true
- [x] Configure depends_on: db (service_healthy), migrate (service_completed_successfully)
- [x] Removed BETTER_AUTH_* env vars (not needed for direct DB seeding)

**Task 7: Update CI workflow** ✅ COMPLETE
- [x] Add migrate image build step to `.github/workflows/ci.yml`
- [x] Configure context: `.` (root), file: `./apps/migrate/Dockerfile`
- [x] Use GitHub Actions caching (scope: planner-migrate)
- [x] Image tag: `ghcr.io/${{ github.repository }}-migrate:${IMAGE_TAG}`

**Task 8: Update root scripts** ✅ COMPLETE
- [x] Update `package.json` db scripts to use migrate app
- [x] Update `turbo.json` with `start` and `generate` tasks
- [x] Scripts: db:generate, db:migrate, db:seed, db:reset

**Task 9: Testing** ✅ COMPLETE
- [x] Create `apps/migrate/.env` with DATABASE_URL
- [x] Test `bun run db:reset` - Reset works, migrations complete, seeding works
- [x] **BUG FIXED**: Tables not created - root cause was drizzle schema not being dropped
  - Drizzle stores migrations journal in `"drizzle"."__drizzle_migrations"` (separate schema)
  - Reset was only dropping `public` schema, leaving drizzle schema with old migration records
  - Fix: Added `DROP SCHEMA IF EXISTS drizzle CASCADE;` to reset.ts
- [x] Test idempotency - running `bun run db:migrate` skips existing users ✅
- [x] Test Docker build with `turbo prune --docker` ✅
- [x] Test Docker container against local database ✅
- [x] Create test PR to verify preview migration/seeding (PR #5)
- [x] Verify CI builds migrate image ✅
- [x] Verify preview deployment creates test users ✅
- [x] Test login with test@example.com / TestPassword123! ✅
- [x] Verify preview deployment updates on push ✅

#### Bug Fix (2025-12-05)

**Problem:** `bun run db:reset` showed migrations complete but tables were not created.

**Root Cause:**
Drizzle ORM stores its migration journal in the `drizzle` schema (`drizzle.__drizzle_migrations`), not in `public`. Our reset function was only dropping tables in `public` schema, leaving the migration journal intact. When migrations ran, drizzle found the old migration records and skipped re-applying them.

**Fix Applied:**
Added `DROP SCHEMA IF EXISTS drizzle CASCADE;` to `apps/migrate/src/reset.ts` to ensure the migration journal is also dropped during reset.

**Verification:**
```
🗑️  Resetting database (dropping all tables)...
✅ Database reset complete
⏳ Running migrations...
✅ Migrations complete
👤 Seeding test users...
  ✅ Created: test@example.com
  ✅ Created: admin@example.com
  ✅ Created: demo@example.com
  📧 Created: unverified@example.com
📊 Summary: 4 created, 0 existing
✅ Database setup complete!
```

---

#### Benefits Summary

**✅ Clean Architecture:**
- Schema definitions separated from operations
- No file copying hacks or workarounds
- Self-contained migration app

**✅ Unified Approach:**
- Same solution for preview AND production
- One test dataset for dev, preview, e2e
- Consistent behavior across environments

**✅ Safety:**
- Explicit reset flag prevents accidents
- Production data protected
- Clear intent in configurations

**✅ Developer Experience:**
- Simple workflow: edit schema → generate → migrate
- Familiar root scripts (`bun run db:*`)
- Fast iteration with docker compose

**✅ Maintainability:**
- Less code (one seed profile for all non-prod)
- Clear ownership (migrate app owns DB setup)
- Easy to extend (add more seed data as needed)

---

### Phase 4: Dokploy Production Deployment

**RESEARCH TASKS (DO THESE FIRST):**

- [ ] **RESEARCH: Dokploy production deployment configuration**
  - [ ] Research Dokploy production environment setup
  - [ ] Research deployment triggering (automatic on main push vs manual approval)
  - [ ] Research production environment variables management
  - [ ] Research production secrets management (encryption, access control)
  - [ ] Research deployment history and audit logs
  - [ ] Research deployment notifications (Slack, email, webhooks)
  - [ ] Document production deployment workflow

- [ ] **RESEARCH: Dokploy zero-downtime deployment features**
  - [ ] Research if Dokploy handles zero-downtime automatically
  - [ ] Research blue-green deployment support in Dokploy
  - [ ] Research rolling deployment support in Dokploy
  - [ ] Research traffic routing during deployment (load balancer)
  - [ ] Research connection draining for graceful shutdowns
  - [ ] Research deployment strategies configuration (instant vs gradual)
  - [ ] Document Dokploy zero-downtime capabilities

- [ ] **RESEARCH: Dokploy health check configuration**
  - [ ] Research Dokploy health check endpoint configuration
  - [ ] Research health check retry logic and timeouts
  - [ ] Research readiness vs liveness probes (if supported)
  - [ ] Research deployment verification after health checks pass
  - [ ] Research health check failure handling (rollback triggers)
  - [ ] Document health check implementation requirements

- [ ] **RESEARCH: Dokploy rollback capabilities**
  - [ ] Research Dokploy rollback to previous deployment
  - [ ] Research rollback triggers (manual vs automatic on health check failure)
  - [ ] Research rollback speed and downtime
  - [ ] Research rollback limitations (database migrations, stateful changes)
  - [ ] Research deployment version history (how many versions kept)
  - [ ] Research rollback testing strategies
  - [ ] Document rollback procedure

**⚠️ MANDATORY PAUSE POINT:**

- [ ] **STOP: Document and present Phase 4 research findings**
  - [ ] Create `.bmad-ephemeral/stories/1-5-research/phase-4-production.md`
  - [ ] Document all findings with sources, recommendations, trade-offs
  - [ ] Present summary to user with link to full research document
  - [ ] **WAIT for user approval/feedback before proceeding**
  - [ ] Update research document with user feedback if any
  - [ ] Mark research as "Approved" only after user confirms
  - [ ] Proceed to implementation ONLY after approval

**IMPLEMENTATION TASKS (ADD AFTER USER APPROVAL):**

- [ ] (Tasks will be added here after user approves Phase 4 research findings)

**VERIFICATION:**

- [ ] Merge PR to main - verify production deployment triggers
- [ ] Verify production deployment succeeds
- [ ] Verify health checks pass
- [ ] Verify production app is accessible and functional
- [ ] Test all critical features in production (auth, navigation, theme)
- [ ] Verify zero-downtime deployment (no user impact during deploy)
- [ ] Test rollback procedure (if safe to test, or in staging first)
- [ ] Verify deployment notifications work (if configured)
- [ ] Mark Phase 4 COMPLETE before moving to Phase 5

---

### Phase 5: Dependency Management (Optional)

**RESEARCH TASKS (DO THESE FIRST):**

- [ ] **RESEARCH: Dependabot vs Renovate comparison**
  - [ ] Compare features, configuration complexity, PR quality
  - [ ] Research Bun package manager support (bun.lockb)
  - [ ] Research monorepo support (Turborepo workspaces)
  - [ ] Research auto-merge capabilities (rules, safety checks)
  - [ ] Research GitHub Actions integration
  - [ ] Research noise level (how many PRs created)
  - [ ] Document recommended tool and configuration

- [ ] **RESEARCH: Auto-merge strategies for patch updates**
  - [ ] Research safety criteria for auto-merge (CI passes, no breaking changes)
  - [ ] Research semantic versioning interpretation (patch vs minor vs major)
  - [ ] Research grouping updates (all patches in one PR vs separate)
  - [ ] Research PR review requirements (bypass vs require approval)
  - [ ] Research auto-merge time windows (e.g., only during work hours)
  - [ ] Research auto-merge rollback if issues detected
  - [ ] Document auto-merge strategy

- [ ] **RESEARCH: Security vulnerability scanning**
  - [ ] Research GitHub Security / Dependabot security alerts
  - [ ] Research Snyk integration (features, pricing)
  - [ ] Research npm audit / bun audit capabilities
  - [ ] Research security update prioritization (CVSS scores)
  - [ ] Research automated security update PRs
  - [ ] Research security policy configuration (GitHub Security)
  - [ ] Document security scanning approach

**⚠️ MANDATORY PAUSE POINT:**

- [ ] **STOP: Document and present Phase 5 research findings**
  - [ ] Create `.bmad-ephemeral/stories/1-5-research/phase-5-dependencies.md`
  - [ ] Document all findings with sources, recommendations, trade-offs
  - [ ] Present summary to user with link to full research document
  - [ ] **WAIT for user approval/feedback before proceeding**
  - [ ] Update research document with user feedback if any
  - [ ] Mark research as "Approved" only after user confirms
  - [ ] Proceed to implementation ONLY after approval

**IMPLEMENTATION TASKS (ADD AFTER USER APPROVAL):**

- [ ] (Tasks will be added here after user approves Phase 5 research findings)

**VERIFICATION:**

- [ ] Verify dependency update bot creates PRs
- [ ] Verify security alerts are visible in GitHub Security tab
- [ ] Verify auto-merge works for patch updates (if configured)
- [ ] Verify security updates are prioritized (created quickly)
- [ ] Verify grouped updates work (if configured)
- [ ] Mark Phase 5 COMPLETE

---

## Dev Notes

### Architecture Patterns and Constraints

**Monorepo Build Orchestration:**
- Turborepo 2.5.4 manages build pipeline across packages
- `turbo.json` defines task dependencies and caching strategy
- Packages should have consistent scripts: `build`, `lint`, `typecheck`, `test`
- Turborepo caching reduces build time in CI

**Next.js 16 Production Optimizations:**
- Automatic code splitting per route
- Image optimization via Next.js Image component
- Static asset caching with far-future headers
- Minification and tree shaking enabled by default
- Server Components reduce client-side JavaScript
- **Standalone output mode** for Docker (includes only necessary files)

**Environment Variable Management:**
- Next.js public variables: prefix with `NEXT_PUBLIC_` (client-side accessible)
- Server-only variables: no prefix (only available in server components/API routes)
- Validation: Use Zod schema to validate at startup
- Fail fast: Application should not start with invalid environment

[Source: docs/architecture.md#Core-Technologies]

**CI/CD Quality Gates:**
- Linting: Ultracite/Biome enforces strict code quality
- Type checking: TypeScript strict mode catches type errors
- Testing: Unit tests via Bun (Story 1.6 will add E2E tests)
- Build: Production build must succeed before deployment
- Docker: Multi-stage build for optimal image size

**Self-Hosted Deployment (Dokploy):**
- Preview deployments for every PR with unique URLs (Dokploy feature)
- Production deployment from main branch
- Environment-specific configuration
- Zero-downtime deployments (Dokploy capability - verify in research)
- Health checks and deployment verification
- Rollback capabilities (Dokploy feature - verify in research)

[Source: docs/epics/epic-1-foundation-project-infrastructure.md#Story-1.5]

### Research Documentation Template

Each phase research document follows this structure:

```markdown
# Phase X Research: [Phase Name]

**Date:** YYYY-MM-DD
**Researcher:** [Agent/Human]
**Status:** Draft | Reviewed | Approved

## Research Questions

- [ ] Question 1
- [ ] Question 2

## Findings

### Topic 1: [Research Topic]

**Summary:** Brief overview

**Sources:**
- [Source 1 with link]
- [Source 2 with link]

**Key Insights:**
- Insight 1
- Insight 2

**Recommendations:**
- Recommendation 1
- Recommendation 2

**Trade-offs:**
- Pro: ...
- Con: ...

## Final Recommendations

**Recommended Approach:**
[Summary of recommended approach]

**Rationale:**
[Why chosen over alternatives]

## Next Steps (Pending User Approval)

- [ ] Implementation task 1
- [ ] Implementation task 2

## User Approval

- [ ] User reviewed research findings
- [ ] User approved approach
- [ ] User requested changes: [describe if any]
- [ ] Ready to proceed with implementation: YES/NO
```

### Implementation Approach

**Gradual Improvement Pattern with Human Verification:**

Each phase follows this cycle:
1. **Research** - Gather latest best practices and Dokploy-specific patterns
2. **Document** - Create research document with findings, sources, recommendations
3. **Present** - Show summary to user with link to full research
4. **Wait** - MANDATORY pause for user approval/feedback
5. **Adjust** - Update based on user feedback if needed
6. **Plan** - Update task list with approved implementation tasks
7. **Implement** - Execute tasks based on approved research
8. **Verify** - Test in real environment (PR or deployment)
9. **Document** - Update README with findings
10. **Move to next phase** - Only after current phase is verified working

**Why This Approach:**
- Prevents over-planning based on outdated assumptions
- Ensures implementation uses latest industry standards
- Leverages Dokploy features instead of reinventing the wheel
- Allows human oversight and course correction at each phase
- Research findings become baseline for verification
- Validates each phase before investing in next phase
- Reduces risk of rework due to incorrect assumptions

**Dokploy-Centric Focus:**
- Research Dokploy capabilities thoroughly before implementing custom solutions
- Use Dokploy built-in features (preview environments, zero-downtime, health checks)
- Integrate with Dokploy's GitHub integration for seamless workflow
- Leverage Dokploy's environment variable and secrets management

### Testing Strategy

**Phase 1 Testing (CI Pipeline):**
- Create test PRs with intentional errors (lint, type, build)
- Verify pipeline fails at correct stage with clear errors
- Verify pipeline passes with clean code
- Verify caching works (second run should be faster)
- Verify pipeline runs on all branches and PRs

**Phase 2 Testing (Docker):**
- Build and run Docker image locally
- Verify app starts and all features work
- Verify health check endpoint responds
- Verify image size is reasonable
- Verify image is pushed to registry with correct tags
- Verify caching works (second build faster)

**Phase 3 Testing (Preview Deployments):**
- Create PR and verify Dokploy preview deployment
- Test all features in preview environment
- Verify integration tests run and pass
- Verify preview URL is accessible
- Push update to PR and verify preview updates
- Verify cleanup when PR is closed

**Phase 4 Testing (Production):**
- Merge PR to main and verify Dokploy production deployment
- Test all critical features in production
- Verify health checks pass
- Verify zero-downtime deployment (if Dokploy supports)
- Test rollback procedure (if safe)

**Phase 5 Testing (Dependencies):**
- Verify dependency update PRs are created
- Verify auto-merge works correctly
- Verify security alerts are visible

### Component Touchpoints

**Files to Create:**

**Phase 1 (Complete):**
- ✅ `.github/workflows/ci.yml` - GitHub Actions CI/CD pipeline (verify job)
- ✅ `.bmad-ephemeral/stories/1-5-research/phase-1-ci-pipeline.md` - Phase 1 research

**Phase 2 (Current):**
- ✅ `.bmad-ephemeral/stories/1-5-research/phase-2-docker.md` - Phase 2 research
- [ ] `.github/actions/setup-bun-workspace/action.yml` - Reusable composite action
- [ ] `apps/web/Dockerfile` - Single-stage runtime Docker image
- [ ] `apps/web/.dockerignore` - Docker ignore file

**Phase 3 (Deferred):**
- [ ] `.bmad-ephemeral/stories/1-5-research/phase-3-preview-deployments.md` - Phase 3 research
- [ ] Dokploy preview configuration (UI-based, not file)

**Phase 4 (Deferred):**
- [ ] `.bmad-ephemeral/stories/1-5-research/phase-4-production.md` - Phase 4 research
- [ ] Production deployment strategy (TBD)

**Phase 5 (Optional):**
- [ ] `.bmad-ephemeral/stories/1-5-research/phase-5-dependencies.md` - Phase 5 research
- [ ] Dependency management bot configuration

**Files to Update:**

**Phase 1 (Complete):**
- ✅ `README.md` - Added CI/CD Pipeline section

**Phase 2 (Current):**
- [ ] `.github/workflows/ci.yml` - Add docker-build job, use composite action
- [ ] `apps/web/next.config.ts` - Add output: 'standalone'
- [ ] `apps/web/.env.example` - Update/verify env var documentation
- [ ] `README.md` - Add Docker deployment section

**Existing Infrastructure to Leverage:**
- `bun run check` - Already configured and passing
- TypeScript strict mode - Already enforced
- Next.js production build - Already functional
- Better-Auth - Already configured
- PostgreSQL - Already set up locally

### Code Quality Requirements

**Linting and Formatting:**
- All code must pass `bun run check` with 0 errors
- Follow Ultracite/Biome code standards from `.claude/CLAUDE.md`
- TypeScript strict mode enforced across all packages

**Build Requirements:**
- Production build must succeed on clean code
- Docker image size should be reasonable (< 500MB)
- No build warnings that indicate issues
- All dependencies properly resolved

**Environment Configuration:**
- All required environment variables documented in `.env.example`
- Environment validation fails fast with clear error messages
- No secrets committed to repository (use .gitignore)
- Separate configuration for dev/staging/prod

[Source: docs/architecture.md#Code Quality Standards]

### Deployment Best Practices

**Environment Separation:**
- Development: Local `.env.local` file with local PostgreSQL
- Preview: Dokploy preview environments with preview database
- Production: Dokploy production environment with production database

**Secrets Management:**
- Never commit secrets to git
- Use GitHub Actions secrets for Docker registry credentials
- Use Dokploy environment variables for app secrets
- Rotate secrets periodically
- Use different secrets for each environment

**Rollback Strategy:**
- Keep previous Docker images in registry
- Use Dokploy rollback feature to previous deployment
- Keep database migrations backward-compatible when possible
- Document rollback procedure in README

**Monitoring and Verification:**
- Health checks verify deployment success
- Integration tests verify features work
- Monitor error rates after deployment
- Set up alerts for deployment failures

### References

**Epic and Technical Specifications:**
- [Source: docs/epics/epic-1-foundation-project-infrastructure.md#Story-1.5]
- [Source: .bmad-ephemeral/stories/tech-spec-epic-1.md#Story-1.5] (if exists)

**Architecture Documentation:**
- [Source: docs/architecture.md#Core-Technologies]
- [Source: docs/architecture.md#Code Quality Standards]

**Previous Story Context:**
- [Source: .bmad-ephemeral/stories/1-4-basic-ui-shell-and-theme-system.md#Completion-Notes-List]

**External Documentation (TO BE RESEARCHED):**
- Dokploy: https://docs.dokploy.com/
- GitHub Actions: https://docs.github.com/en/actions
- Bun GitHub Action: https://github.com/oven-sh/setup-bun
- Turborepo: https://turbo.build/repo/docs
- Next.js Docker: https://nextjs.org/docs/app/building-your-application/deploying/docker
- Next.js Standalone: https://nextjs.org/docs/app/api-reference/next-config-js/output
- Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/

**Code Standards:**
- [Source: .claude/CLAUDE.md#Ultracite-Code-Standards]

## Dev Agent Record

### Context Reference

- `.bmad-ephemeral/stories/1-5-deployment-pipeline-and-environment-configuration.context.xml`

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Phase 1 Implementation (2025-11-16):**
- ✅ Completed research on GitHub Actions patterns for Bun monorepos
- ✅ Created `.bmad-ephemeral/stories/1-5-research/phase-1-ci-pipeline.md` with comprehensive findings
- ✅ Implemented `.github/workflows/ci.yml` with sequential verification job
- ✅ Configured Bun setup with v2 action, pinned to version 1.3.1
- ✅ Configured caching: Bun dependencies via `actions/cache@v4` and Turborepo via `rharkor/caching-for-turbo@v2.3.2`
- ✅ Configured concurrency groups to cancel outdated runs on new commits
- ✅ Set up triggers: pull_request, push (main), workflow_dispatch
- ✅ Verified `check-types` script exists in package.json (line 27)
- ✅ Documented CI pipeline in README with automated checks section
- ✅ Committed and pushed changes (commit 9ccf37a)
- ✅ Pipeline verification complete - CI passing with success status

**Implementation Details:**
- Workflow executes sequentially: lint → typecheck → build
- Timeout set to 15 minutes
- Using ubuntu-latest runner
- Bun cache path: `~/.bun/install/cache`
- Cache key based on `bun.lockb` hash
- User updated workflow: Added `--frozen-lockfile` flag and `DATABASE_URL` env var for build

**Phase 2 Research (2025-11-17):**
- ✅ Researched Next.js 16 Dockerfile best practices with standalone output
- ✅ Researched multi-stage Docker builds vs build-reuse pattern
- ✅ Analyzed existing CI caching infrastructure (Bun + Turborepo)
- ✅ Researched Turborepo cache in Docker builds (`turbo prune --docker`)
- ✅ Compared performance: Build-reuse (1 min) vs Docker-in-Docker (5-10 min)
- ✅ Researched GitHub Container Registry (GHCR) integration with Dokploy
- ✅ Researched Docker layer caching with GitHub Actions cache backend (type=gha)
- ✅ Researched latest GitHub Actions versions (2025): build-push-action@v6, setup-buildx-action@v3, login-action@v3, metadata-action@v5
- ✅ Researched Docker tagging strategy for preview deployments
- ✅ Discussed with user: Avoid `latest` tag confusion, focus on preview environments
- ✅ Researched workflow DRY principles with composite actions
- ✅ Created `.bmad-ephemeral/stories/1-5-research/phase-2-docker.md` with comprehensive findings
- ✅ User approved build-reuse pattern (Option A)
- ✅ User approved preview-focused tagging strategy (pr-XX, sha-XXXXXX)
- ✅ User approved composite action for DRY workflow

**Key Decisions:**
- **Build Strategy:** Option A (Build-Reuse Pattern) - Reuse CI build artifacts instead of rebuilding in Docker
- **Rationale:** 5-10x faster (Turbo cache hit), simpler Dockerfile, leverages existing CI caching infrastructure
- **Tagging Strategy:** Preview-focused only (no `latest` or production tags in Phase 2)
  - `pr-42` - Mutable tag for preview deployments (Dokploy watches this)
  - `sha-abc1234` - Immutable tag for rollback/audit
  - Production/staging tagging deferred to Phase 4
- **Registry:** GitHub Container Registry (GHCR) - Free, native GitHub integration, no rate limits
- **Caching:** GitHub Actions cache backend (type=gha, mode=max, scope=planner-web)
- **DRY:** Composite action (`.github/actions/setup-bun-workspace/`) for setup steps
- **Image Size Target:** <200MB (realistic with standalone output + slim base image)

**Phase 2 Implementation (2025-11-17):**
- ✅ Created `.github/actions/setup-bun-workspace/action.yml` composite action
- ✅ Updated `next.config.ts` with `output: 'standalone'`
- ✅ Created `apps/web/Dockerfile` (single-stage runtime, 255MB)
- ✅ Created `apps/web/.dockerignore` with whitelist pattern for .next/standalone and .next/static
- ✅ Updated `.github/workflows/ci.yml` with docker-build job
- ✅ Enhanced `apps/web/.env.example` documentation
- ✅ Added Docker deployment section to README.md
- ✅ Updated `turbo.json` to cache .next/** outputs (enables build-reuse pattern)
- ✅ Local testing: Build ✅ Run ✅ Size: 255MB ✅ User: nextjs ✅ Startup: 42ms ✅
- ✅ CI testing: Verify job ✅ Docker-build job ✅ GHCR push ✅ Cache working ✅
- ✅ Performance: docker-build completes in ~30 seconds with Turbo cache hit
- ✅ Latest commit: ef82a9a (CI passing with success status)
- ✅ Debug steps removed from CI workflow (clean production-ready state)
- ✅ Phase 2 COMPLETE

**Key Configuration Change:**
- `turbo.json` outputs changed from `["dist/**"]` to `["dist/**", ".next/**", "!.next/cache/**"]`
- This is a REQUIRED change (not debug code) that enables the build-reuse pattern
- Without it, Turborepo wouldn't cache .next/ directory, breaking docker-build performance
- Evidence: CI logs show "cache hit, replaying logs" - docker-build instant (30s vs 5-10min)

**Next Steps:**
- Ready to begin Phase 3: Dokploy Preview Deployments
- Research Dokploy preview environment features and GitHub integration
- Plan preview deployment workflow

### File List

**Phase 1:**
- ✅ Created: `.github/workflows/ci.yml` - GitHub Actions CI pipeline (verify job)
- ✅ Created: `.bmad-ephemeral/stories/1-5-research/phase-1-ci-pipeline.md` - Phase 1 research findings
- ✅ Modified: `README.md` - Added CI/CD Pipeline section (lines 92-123)

**Phase 2:**
- ✅ Created: `.bmad-ephemeral/stories/1-5-research/phase-2-docker.md` - Phase 2 research findings
- ✅ Created: `.github/actions/setup-bun-workspace/action.yml` - Reusable composite action
- ✅ Created: `apps/web/Dockerfile` - Single-stage runtime Docker image (255MB)
- ✅ Created: `apps/web/.dockerignore` - Docker ignore rules (whitelist .next/standalone and .next/static)
- ✅ Modified: `.github/workflows/ci.yml` - Added docker-build job, using composite action
- ✅ Modified: `apps/web/next.config.ts` - Added output: 'standalone'
- ✅ Modified: `apps/web/.env.example` - Enhanced env var documentation
- ✅ Modified: `README.md` - Added Docker deployment section
- ✅ Modified: `turbo.json` - Added .next/** to build outputs (required for build-reuse pattern)

**Phase 3.5:**
- ✅ Created: `apps/migrate/` - Complete migration app with drizzle-orm and seeding
- ✅ Created: `apps/migrate/Dockerfile` - Uses turbo prune --docker for optimized builds
- ✅ Created: `apps/migrate/src/reset.ts` - Database reset with safety checks
- ✅ Created: `apps/migrate/src/seed/` - Test user seeding with Better Auth compatible passwords
- ✅ Modified: `.github/workflows/ci.yml` - Added turbo prune and migrate image build
- ✅ Modified: `.dokploy/docker-compose.preview.yml` - Added migrate service
- ✅ Modified: `package.json` - Added db:generate, db:migrate, db:seed, db:reset scripts
- ✅ Modified: `turbo.json` - Added start and generate tasks

## Change Log

- 2025-11-16: Story drafted from Epic 1 Story 1.5 specifications. Established research-first, gradual improvement pattern with mandatory human verification pauses after each research phase. 5 phases: Basic CI, Docker Integration, Dokploy Preview Deployments, Dokploy Production Deployment, Dependency Management. Key decisions: CI runs on all PRs/branches (not just main), self-hosted deployment via Dokploy (NOT Vercel), Docker-based deployment with Next.js standalone mode, integration tests on preview deployments. All implementation tasks deferred until research phase completes AND user approves for each phase. Research findings documented in dedicated files (`.bmad-ephemeral/stories/1-5-research/phase-X-*.md`) to serve as baseline for verification and implementation. Research tasks are Dokploy-focused to leverage platform features (preview environments, zero-downtime deployments, health checks, rollbacks).

- 2025-11-17: Phase 2 research completed and approved. Key research findings: (1) Build-reuse pattern selected over Docker-in-Docker for 5-10x performance improvement by leveraging existing Bun+Turbo caching; (2) Preview-focused tagging strategy (`pr-XX` for deployments, `sha-XXXXXX` for rollback) with production tagging deferred to Phase 4 to avoid `latest` confusion; (3) GitHub Container Registry (GHCR) selected for free, rate-limit-free integration with Dokploy; (4) Composite action pattern (`.github/actions/setup-bun-workspace/`) to DRY up duplicated setup steps in workflow; (5) Single-stage runtime Dockerfile targeting <200MB image size with Next.js standalone output, Bun slim runtime, non-root user security hardening. Updated story with detailed implementation tasks for Phase 2 including composite action creation, Dockerfile creation, workflow updates, and comprehensive verification steps. Ready to begin Phase 2 implementation.

- 2025-12-05: Phase 3.5 (Database Migrations & Seeding) completed. Created dedicated `apps/migrate` app for database migrations and seeding in preview deployments. Key implementation: (1) Used `turbo prune --docker` for optimized Docker builds per Turborepo best practices; (2) Password hashing with Node.js crypto scrypt using Better Auth compatible parameters (N=16384, r=16, p=1, dkLen=64, format `${salt}:${hash}`); (3) Safety checks prevent accidental production reset (error if RESET_DB=true with SEED_PROFILE=none); (4) Fixed drizzle migrate bug where migrations reported success but tables weren't created - root cause was drizzle schema not being dropped during reset; (5) Idempotent seeding skips existing users. PR #5 verified: CI builds migrate image successfully, preview deployment runs migrations and seeds test users, login with test@example.com works. Phase 3 + 3.5 COMPLETE.

- 2025-11-17: Phase 2 implementation completed successfully. Created composite action (`.github/actions/setup-bun-workspace/`) eliminating code duplication in CI workflow. Created single-stage Dockerfile with security hardening (non-root user, slim base image, telemetry disabled). Discovered and resolved .dockerignore issue - needed to whitelist `.next/standalone` and `.next/static` while excluding rest of `.next/*`. Updated `turbo.json` to cache `.next/**` outputs (required for build-reuse pattern to work - enables Turborepo to cache Next.js build artifacts between verify and docker-build jobs). Local testing confirmed: Docker image builds successfully (255MB, 13% above target but production-ready), container starts in 42ms, app accessible and functional, running as non-root user `nextjs`. CI testing successful: `verify` job passes with Turbo cache hits, `docker-build` job completes in ~30 seconds (instant cache replay), image pushed to GHCR with tag `sha-ef82a9a`, Docker layer cache working (GHA cache scope: planner-web, mode: max). Documentation updated: README Docker deployment section added, .env.example enhanced with detailed comments. Debug steps removed from CI workflow (production-ready). Phase 2 COMPLETE - all tasks verified, CI passing, ready for Phase 3 (Dokploy preview deployments).
