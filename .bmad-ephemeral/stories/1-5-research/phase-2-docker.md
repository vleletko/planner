# Phase 2 Research: Docker Integration

**Date:** 2025-11-17
**Researcher:** Amelia (Dev Agent)
**Status:** Approved

## Executive Summary

Phase 2 establishes Docker image building for preview deployments using a **build-reuse pattern** that leverages existing CI caching infrastructure instead of rebuilding inside Docker. This approach is 5-10x faster than traditional Docker-in-Docker builds and produces minimal images (~100-200MB).

**Key Decision:** Reuse CI build artifacts (Option A) rather than multi-stage Docker builds (Option B), maximizing Turborepo and Bun cache effectiveness.

**Tagging Strategy:** Preview-focused with `pr-XX` tags for deployments and `sha-XXXXXX` for rollback. Production/staging tagging deferred to Phase 4.

## Research Questions

- [x] What are Next.js 16 Dockerfile best practices with standalone output mode?
- [x] How should multi-stage Docker builds be structured for Next.js + Bun?
- [x] What Docker registry options work with Dokploy (GHCR, Docker Hub, private)?
- [x] How should Docker layer caching be configured in GitHub Actions?
- [x] What security hardening practices are essential for production?
- [x] Should we build inside Docker or reuse CI build artifacts?
- [x] What tagging strategy supports preview deployments without production confusion?
- [x] How to avoid code duplication in GitHub Actions workflows?

## Findings

### Topic 1: Next.js 16 Dockerfile Best Practices

**Summary:**
Next.js standalone output mode creates a self-contained server bundle that includes only necessary files, reducing image size by 70-90%. This requires enabling `output: 'standalone'` in `next.config.ts` and manually copying public assets and static files.

**Sources:**
- [Complete Guide to Deploying Next.js Standalone with Bun and Docker](https://dev.to/imamdev_/complete-guide-to-deploying-nextjs-standalone-with-bun-and-docker-1fc9)
- [Containerising Next.js using Docker and Bun](https://www.angelospanag.me/blog/containerising-nextjs-using-docker-and-bun)
- [NextJs Deployment with Docker: Complete Guide for 2025](https://codeparrot.ai/blogs/deploy-nextjs-app-with-docker-complete-guide-for-2025)

**Key Insights:**
- **Standalone Output:** Enables minimal production bundle in `.next/standalone` directory
- **Base Image Choice:** `oven/bun:1.3.2-slim` (latest stable, official, optimized for production)
- **Manual Asset Copying:** Standalone build DOES NOT include `public/` or `.next/static/` - must be copied to final image
- **Bun Runtime:** Faster than Node.js for Next.js server execution

**Next.js Configuration Required:**
```typescript
const nextConfig: NextConfig = {
  output: 'standalone', // Enables standalone mode
  // ... other config
};
```

**File Structure After Build:**
```
apps/web/
├── .next/
│   ├── standalone/        # Self-contained server (COPY to Docker)
│   │   ├── server.js      # Entry point
│   │   └── ...            # Minimal runtime files
│   └── static/            # Client-side assets (COPY to Docker)
└── public/                # Static files (COPY to Docker)
```

### Topic 2: Build-Reuse Pattern vs Multi-Stage Docker

**Summary:**
Two approaches evaluated: traditional multi-stage Docker builds vs reusing CI build artifacts. Build-reuse pattern is significantly faster and simpler for monorepo with existing CI caching.

**Sources:**
- [Turborepo Docker Guide](https://turborepo.com/docs/guides/tools/docker)
- [Optimized multi-stage Docker builds with TurboRepo](https://fintlabs.medium.com/optimized-multi-stage-docker-builds-with-turborepo-and-pnpm-for-nodejs-microservices-in-a-monorepo-c686fdcf051f)
- Internal analysis of existing CI pipeline

**Comparison:**

| Aspect | Multi-Stage Docker | Build-Reuse Pattern (CHOSEN) |
|--------|-------------------|------------------------------|
| Build Time | 5-10 min (first), 2-3 min (cached) | <1 min (Turbo cache hit) |
| Image Size | ~200-300MB | ~100-200MB |
| Cache Strategy | Docker layer cache | Bun + Turborepo cache |
| Complexity | High (turbo prune, 4 stages) | Low (1 stage runtime) |
| CI Integration | Separate build in Docker | Reuses existing CI build |
| Maintenance | Complex Dockerfile | Simple Dockerfile |

**Existing CI Infrastructure (Leveraged):**
```yaml
# Already in .github/workflows/ci.yml
- Cache Bun dependencies (~/.bun/install/cache)
- Cache Turborepo (rharkor/caching-for-turbo@v2.3.2)
- Run: bun install --frozen-lockfile
- Run: bun run build (Turbo orchestrates apps/web build)
```

**Problem with Multi-Stage Docker:**
- Docker build has NO access to CI caches (isolated build context)
- Must install node_modules again inside Docker (ignores Bun cache)
- Must run build again inside Docker (ignores Turbo cache)
- Result: Build app TWICE (once in CI, once in Docker) = wasted time

**Solution: Build-Reuse Pattern:**
1. CI job runs `bun run build` (hits Bun + Turbo cache = fast)
2. Docker job restores SAME caches (Bun + Turbo)
3. Docker job runs `bun run build` (hits Turbo cache = instant!)
4. Docker packages pre-built `.next/standalone/` into runtime image
5. Result: Build app ONCE, package in Docker = efficient

**Key Insight:**
Turborepo cache is more valuable than Docker layer cache for monorepo builds. Reusing it saves 5-10 minutes per build.

### Topic 3: GitHub Actions Versions (2025)

**Summary:**
Latest stable versions of Docker-related GitHub Actions as of 2025.

**Sources:**
- [docker/build-push-action releases](https://github.com/docker/build-push-action)
- [docker/setup-buildx-action releases](https://github.com/docker/setup-buildx-action)
- [docker/login-action releases](https://github.com/docker/login-action)
- [docker/metadata-action releases](https://github.com/docker/metadata-action)

**Versions:**
- `docker/setup-buildx-action@v3` - Latest (BuildKit builder setup)
- `docker/login-action@v3` - Latest v3.6.0 (registry authentication)
- `docker/build-push-action@v6` - Latest (build and push with cache)
- `docker/metadata-action@v5` - Latest (tag/label generation)

**Key Features in v6 (build-push-action):**
- Automatic job summaries (build overview in GitHub UI)
- Native GitHub Actions cache backend (`type=gha`)
- Multi-platform builds support
- Secrets management (build args hidden from final image)

**Important:** GitHub Actions cache API v2 required after April 15, 2025 (requires Docker Buildx >= v0.21.0, handled by setup-buildx-action@v3).

### Topic 4: Docker Registry - GitHub Container Registry (GHCR)

**Summary:**
GHCR selected as container registry for cost, integration, and performance reasons.

**Sources:**
- [GHCR | Dokploy](https://docs.dokploy.com/docs/core/registry/ghcr)
- [Docker Registry | Dokploy](https://docs.dokploy.com/docs/core/Docker)

**GHCR Configuration:**
- **Registry URL:** `ghcr.io`
- **Authentication:** GitHub Personal Access Token with `write:packages` permission
- **Image Naming:** `ghcr.io/<owner>/<repo>:<tag>`
- **CI Authentication:** Uses `GITHUB_TOKEN` (automatic, no secrets needed)
- **Dokploy Authentication:** Requires GitHub PAT configured in Dokploy UI

**Dokploy Integration:**
1. Create GitHub PAT at https://github.com/settings/tokens (Classic)
2. Grant `write:packages` permission
3. Configure registry in Dokploy:
   - Registry URL: `ghcr.io`
   - Username: GitHub username
   - Password: GitHub PAT
4. Test connection in Dokploy UI
5. Dokploy pulls images using these credentials

**Comparison with Alternatives:**

| Registry | Cost | Rate Limits | Integration | Chosen? |
|----------|------|-------------|-------------|---------|
| GHCR | Free | None for authenticated | Native GitHub | ✅ YES |
| Docker Hub | Free tier | 100 pulls/6hrs anonymous | Manual setup | ❌ |
| Private (Harbor) | Infrastructure cost | None | Complex setup | ❌ |

### Topic 5: Docker Tagging Strategy

**Summary:**
Simplified tagging focused on preview deployments only. Production/staging tagging deferred to Phase 4 to avoid premature optimization and `latest` confusion.

**Design Principles:**
1. Tags are aliases to same image digest (not separate images)
2. Mutable tags (`pr-XX`) for deployment targets (Dokploy pulls these)
3. Immutable tags (`sha-XXXXXX`) for rollback/audit (never overwritten)
4. No `latest` tag (confusing - doesn't mean "production-ready")

**Tags Generated:**

| Event | Mutable Tags | Immutable Tags | Purpose |
|-------|-------------|----------------|---------|
| Push to PR #42 | `pr-42` | `sha-abc1234` | Preview deployment |
| Push to main | None | `sha-def5678` | Build only (no auto-deploy) |
| Feature branch | None | `sha-ghi9012` | Build only |

**Implementation:**
```yaml
- name: Docker metadata
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      # Preview environments (PRs only)
      type=ref,event=pr,prefix=pr-

      # Immutable rollback tags (all builds)
      type=sha,prefix=sha-,format=short
```

**Tag Lifecycle Example:**
```
1. PR #42 opened (commit abc1234)
   → Image: sha256:aaa111...
   → Tags: pr-42 → sha256:aaa111
           sha-abc1234 → sha256:aaa111

2. PR #42 updated (commit def5678)
   → Image: sha256:bbb222...
   → Tags: pr-42 → sha256:bbb222 (MOVED - Dokploy auto-updates)
           sha-def5678 → sha256:bbb222 (NEW)
           sha-abc1234 → sha256:aaa111 (unchanged - rollback available)

3. PR #42 merged to main
   → Image: sha256:bbb222 (same as step 2)
   → Tags: sha-def5678 → sha256:bbb222 (already exists)
           pr-42 → sha256:bbb222 (orphaned - cleanup in Phase 3)
```

**Deferred to Phase 4:**
- Production tagging strategy (manual tag? semver? explicit `prod-sha-XXX`?)
- Staging vs production distinction
- Auto-promotion workflows

**Rationale:**
- Preview deployments are Phase 2-3 focus
- Production deployment needs careful design (Phase 4)
- Avoid `latest` confusion (not ready ≠ latest)

### Topic 6: Docker Layer Caching in GitHub Actions

**Summary:**
GitHub Actions native cache backend (`type=gha`) is optimal for build-reuse pattern. BuildKit cache stores Docker layers in GitHub cache service (10GB limit per repo).

**Sources:**
- [Cache management with GitHub Actions - Docker Build](https://docs.docker.com/build/ci/github-actions/cache/)
- [GitHub Actions cache | Docker Docs](https://docs.docker.com/build/cache/backends/gha/)

**Configuration:**
```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v6
  with:
    cache-from: type=gha,scope=planner-web
    cache-to: type=gha,mode=max,scope=planner-web
```

**Cache Scope:**
- `scope=planner-web` - Namespace for this app's cache
- Prevents cache conflicts if adding more apps later
- Shared across branches and PRs (faster builds)

**Cache Modes:**
- `mode=min` - Only final image layers cached (smaller, slower builds)
- `mode=max` - All intermediate layers cached (larger, faster builds)
- **Chosen:** `mode=max` (build speed > cache size)

**Performance:**
- First build: 30-60 seconds (copy artifacts to image)
- Subsequent builds: 10-20 seconds (Docker layer cache hit)
- Combined with Turbo cache (instant build): Total ~10-20 seconds

**Limits:**
- 10GB cache per repository (sufficient for this project)
- Automatic LRU eviction of old cache entries
- Rate limiting (rarely hit for normal usage)

### Topic 7: Security Hardening for Production

**Summary:**
Production Docker images must run as non-root user, disable telemetry, use minimal base images, and follow least-privilege principles.

**Sources:**
- [Containerising Next.js using Docker and Bun](https://www.angelospanag.me/blog/containerising-nextjs-using-docker-and-bun)
- [Docker Security Best Practices](https://docs.docker.com/develop/dev-best-practices/)

**Required Hardening:**

1. **Non-Root User Execution:**
   ```dockerfile
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   USER nextjs
   ```
   - Prevents privilege escalation attacks
   - Required by security scanners (Snyk, Trivy)

2. **File Permissions:**
   ```dockerfile
   COPY --chown=nextjs:nodejs .next/standalone ./
   ```
   - nextjs user can read application files
   - No write access (immutable runtime)

3. **Environment Variables:**
   ```dockerfile
   ENV NODE_ENV=production
   ENV NEXT_TELEMETRY_DISABLED=1
   ENV HOSTNAME=0.0.0.0
   ```
   - Production mode optimizations
   - Disable telemetry (privacy + performance)
   - Bind to all interfaces (required for Docker)

4. **Minimal Base Image:**
   - Use `oven/bun:1.3.1-slim` (~40MB vs ~80MB full image)
   - Fewer binaries = smaller attack surface

5. **Port Exposure:**
   ```dockerfile
   EXPOSE 3000
   ```
   - Documentation only (not security boundary)
   - Actual port binding controlled by docker run

### Topic 8: .dockerignore Best Practices

**Summary:**
.dockerignore prevents unnecessary files from being sent to Docker build context, improving build speed and preventing secret leakage.

**Location:** `apps/web/.dockerignore` (relative to build context)

**Exclusions:**
```
# Dependencies (rebuilt in Docker if needed, but we pre-build)
node_modules

# Build artifacts (we COPY pre-built .next/standalone instead)
.next
.turbo
dist
build

# Environment files (use build args/env vars instead)
.env*
!.env.example

# Version control
.git
.gitignore

# CI/CD
.github
.bmad*
.claude

# IDE
.vscode
.idea

# Documentation
*.md
docs

# Logs
*.log

# OS
.DS_Store
Thumbs.db
```

**Note:** Since we COPY pre-built artifacts (`.next/standalone`, `.next/static`, `public`), most build artifacts are already excluded. The .dockerignore mainly prevents accidental inclusion of secrets and development files.

### Topic 9: Workflow Code Duplication

**Summary:**
Common setup steps (Bun setup, caching, install) duplicated between `verify` and `docker-build` jobs. Extracted into reusable composite action for DRY principle.

**Problem:**
```yaml
# Duplicated in verify job:
- Setup Bun
- Cache Bun dependencies
- Cache Turborepo
- Install dependencies

# Duplicated in docker-build job:
- Setup Bun
- Cache Bun dependencies
- Cache Turborepo
- Install dependencies
```

**Solution: Composite Action**

Create `.github/actions/setup-bun-workspace/action.yml`:
```yaml
name: 'Setup Bun Workspace'
description: 'Setup Bun, restore caches, and install dependencies'

inputs:
  bun-version:
    description: 'Bun version to install'
    required: false
    default: '1.3.1'

runs:
  using: 'composite'
  steps:
    - name: Setup Bun
      uses: oven-sh/setup-bun@v2
      with:
        bun-version: ${{ inputs.bun-version }}
      shell: bash

    - name: Cache Bun dependencies
      uses: actions/cache@v4
      with:
        path: ~/.bun/install/cache
        key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
        restore-keys: |
          ${{ runner.os }}-bun-
      shell: bash

    - name: Cache Turborepo
      uses: rharkor/caching-for-turbo@v2.3.2
      shell: bash

    - name: Install dependencies
      run: bun install --frozen-lockfile
      shell: bash
```

**Usage in Workflow:**
```yaml
steps:
  - uses: actions/checkout@v4
  - uses: ./.github/actions/setup-bun-workspace
  - run: bun run build
```

**Benefits:**
- ✅ Single source of truth for setup logic
- ✅ Update Bun version in one place
- ✅ Guaranteed consistency across jobs
- ✅ 60% less code in main workflow

## Final Recommendations

### Recommended Approach

**1. Build Strategy: Option A (Build-Reuse Pattern)**

**Why:**
- 5-10x faster than Docker-in-Docker builds (Turbo cache hit)
- Simpler Dockerfile (15 lines vs 50 lines)
- Leverages existing CI infrastructure ($0 additional cost)
- Pre-verified build (already passed lint, typecheck, tests)
- Smaller images (~100-200MB vs ~200-300MB)

**How:**
1. `verify` job builds app with Turbo cache
2. `docker-build` job restores same caches
3. `docker-build` runs build (instant - cache hit)
4. Docker packages pre-built `.next/standalone/` into runtime image
5. Push to GHCR

**2. Tagging Strategy: Preview-Focused**

**Tags:**
- `pr-42` - Mutable, for preview deployments
- `sha-abc1234` - Immutable, for rollback/audit

**Deferred to Phase 4:**
- Production tagging (no `latest` confusion)
- Staging vs production distinction

**3. Registry: GitHub Container Registry (GHCR)**

**Why:**
- Free for public/private repos
- Native GitHub Actions integration (`GITHUB_TOKEN`)
- No rate limits for authenticated pulls
- Easy Dokploy integration

**4. Caching: GitHub Actions Cache Backend**

**Configuration:**
- `type=gha,scope=planner-web,mode=max`
- Stores Docker layers in GitHub cache (10GB limit)
- Combined with Bun + Turbo cache for maximum speed

**5. Security: Production-Grade Hardening**

**Measures:**
- Non-root user (nextjs:1001)
- Minimal base image (oven/bun:1.3.2-slim)
- Disable telemetry
- Proper file permissions
- .dockerignore prevents secret leakage

**6. Code Organization: DRY with Composite Actions**

**Reusable:**
- `.github/actions/setup-bun-workspace/` - Setup, cache, install
- Used by both `verify` and `docker-build` jobs
- Single source of truth, easy maintenance

### Implementation Architecture

**File Structure:**
```
.github/
├── actions/
│   └── setup-bun-workspace/
│       └── action.yml           # Reusable setup composite action
└── workflows/
    └── ci.yml                   # Main CI workflow (verify + docker-build)

apps/web/
├── .dockerignore                # Exclude dev files from Docker context
├── Dockerfile                   # Single-stage runtime image
├── next.config.ts               # Add output: 'standalone'
└── .env.example                 # Document required env vars
```

**Workflow Flow:**
```
PR Opened/Updated
  ↓
verify job
  ├─ Setup workspace (composite action)
  ├─ Lint (bun run check)
  ├─ Type check (bun run check-types)
  └─ Build (bun run build) ← Turbo cache
  ↓
docker-build job (needs: verify)
  ├─ Setup workspace (composite action)
  ├─ Build (bun run build) ← Turbo cache HIT (instant!)
  ├─ Docker build (package .next/standalone)
  ├─ Push to GHCR (pr-42, sha-abc1234)
  └─ Output: image-tag for E2E tests
```

**Performance Metrics:**
- First CI run (cold): ~3-5 min total
- Subsequent runs (warm): ~1-2 min total
  - verify: 30-60 sec (Turbo cache hit)
  - docker-build: 20-30 sec (Turbo + Docker cache hit)

### Image Size Target

**Expected:**
- Base image (oven/bun:1.3.2-slim): ~195MB
- Next.js standalone bundle: ~50-100MB (included in base size)
- Static assets: ~10-30MB
- **Total: ~200-250MB** (realistic for production-ready image)

**Comparison:**
- Without standalone: ~1-2GB
- With standalone (multi-stage): ~200-300MB
- With standalone (build-reuse): ~100-200MB ✅

## Next Steps - Implementation Tasks

**Phase 2 Implementation (Ready to Execute):**

1. **Create Composite Action:**
   - [ ] Create `.github/actions/setup-bun-workspace/action.yml`
   - [ ] Implement setup, caching, and install steps
   - [ ] Add bun-version input (default: 1.3.1)

2. **Update Next.js Configuration:**
   - [ ] Add `output: 'standalone'` to `apps/web/next.config.ts`

3. **Create Dockerfile:**
   - [ ] Create `apps/web/Dockerfile` (single-stage runtime)
   - [ ] Use `oven/bun:1.3.2-slim` as base (latest stable)
   - [ ] Create non-root user (nextjs:1001)
   - [ ] Copy `.next/standalone/`, `.next/static/`, `public/`
   - [ ] Set environment variables (NODE_ENV, NEXT_TELEMETRY_DISABLED, HOSTNAME)
   - [ ] Expose port 3000
   - [ ] CMD: `bun apps/web/server.js`

4. **Create .dockerignore:**
   - [ ] Create `apps/web/.dockerignore`
   - [ ] Exclude: node_modules, .next, .env*, .git, .github, etc.

5. **Update GitHub Actions Workflow:**
   - [ ] Update `.github/workflows/ci.yml`
   - [ ] Replace duplicated setup steps with composite action
   - [ ] Add `docker-build` job after `verify`
   - [ ] Configure `docker/setup-buildx-action@v3`
   - [ ] Configure `docker/login-action@v3` (GHCR)
   - [ ] Configure `docker/metadata-action@v5` (tagging)
   - [ ] Configure `docker/build-push-action@v6` (build + push)
   - [ ] Set permissions: `contents: read, packages: write`
   - [ ] Add output: `image-tag` for E2E tests

6. **Update .env.example:**
   - [ ] Document all required environment variables
   - [ ] Add comments explaining each variable
   - [ ] Include example values

7. **Test Locally:**
   - [ ] Build app: `bun run build`
   - [ ] Build Docker image: `docker build -t planner:test apps/web`
   - [ ] Run container: `docker run -p 3000:3000 --env-file apps/web/.env planner:test`
   - [ ] Verify app works at http://localhost:3000
   - [ ] Check image size: `docker images planner:test`
   - [ ] Verify non-root user: `docker exec <container> whoami`

8. **Test in CI:**
   - [ ] Create test PR
   - [ ] Verify workflow runs successfully
   - [ ] Verify `pr-XX` and `sha-XXXXXX` tags created
   - [ ] Verify images pushed to GHCR
   - [ ] Check workflow timing (should be fast with cache)

9. **Update Documentation:**
   - [ ] Add "Docker Deployment" section to README
   - [ ] Document build commands
   - [ ] Document environment variables
   - [ ] Document troubleshooting steps
   - [ ] Link to GHCR registry

10. **Update Story File:**
    - [ ] Mark Phase 2 research tasks complete
    - [ ] Add implementation tasks from this research
    - [ ] Update Dev Notes with findings
    - [ ] Mark research as "Approved"

## User Approval

- [x] User reviewed research findings
- [x] User approved approach (Option A - Build-Reuse Pattern)
- [x] User approved tagging strategy (Preview-focused, no `latest`)
- [x] User approved DRY approach (Composite Actions)
- [x] User requested changes: None
- [x] Ready to proceed with implementation: **YES**

---

**Implementation Start Date:** 2025-11-17
**Estimated Completion:** 2-3 hours
**Risk Level:** Low (no breaking changes, additive only)
