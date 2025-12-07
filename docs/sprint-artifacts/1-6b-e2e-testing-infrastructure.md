# Story 1.6b: E2E Testing Infrastructure

Status: Done

## Story

As a developer,
I want E2E testing configured with Playwright running against preview deployments,
so that I can verify user flows work correctly before merging PRs.

## Acceptance Criteria

1. **Playwright Configuration**
   - E2E tests live in dedicated `apps/e2e/` application
   - Playwright is installed and configured
   - Browser automation works (Chromium, Firefox, WebKit)
   - Local test scripts: `bun test:e2e`, `bun test:e2e:ui`, `bun test:e2e:debug`

2. **Test Utilities**
   - Authentication helpers using existing `TEST_USERS` from `apps/migrate/src/seed/test.ts`
   - Page Object Models (POMs) for login and dashboard pages
   - Tests can run against any URL (local or preview deployment)

3. **Example E2E Tests**
   - Login flow E2E test exists and passes
   - Logout flow E2E test exists and passes
   - Screenshots and videos capture on test failure

4. **CI Integration (Preview Deployments)**
   - E2E tests run after `preview-deploy` job succeeds
   - Tests run against preview URL: `https://pr-{number}.{APP_BASE_DOMAIN}`
   - Failing E2E tests are visible in PR (but don't block merge initially)
   - Test artifacts (screenshots, videos, reports) uploaded on failure

5. **Documentation**
   - README in `apps/e2e/` explains how to run tests locally
   - README explains how to write new E2E tests
   - Page Object Model pattern documented

## Out of Scope (Deferred)

- E2E tests on staging/production (no pipeline exists yet)
- Visual regression testing
- Performance testing

## Tasks / Subtasks

- [x] Task 1: Create E2E Application Structure (AC: #1)
  - [x] 1.1: Create `apps/e2e/` directory
  - [x] 1.2: Initialize `apps/e2e/package.json` with name `@planner/e2e`
  - [x] 1.3: Install Playwright: `bun add -D @playwright/test`
  - [x] 1.4: Run `bunx playwright install` to install browsers
  - [x] 1.5: Create `apps/e2e/tsconfig.json`

- [x] Task 2: Configure Playwright (AC: #1, #3)
  - [x] 2.1: Create `apps/e2e/playwright.config.ts`
  - [x] 2.2: Configure multi-browser projects (Chromium, Firefox, WebKit)
  - [x] 2.3: Configure screenshots/videos on failure
  - [x] 2.4: Configure baseURL from environment variable (for preview deployments)
  - [x] 2.5: Configure webServer for local development

- [x] Task 3: Create Test Utilities (AC: #2)
  - [x] 3.1: Create `apps/e2e/src/fixtures/` directory
  - [x] 3.2: Create `auth.fixture.ts` importing TEST_USERS from `@planner/migrate`
  - [x] 3.3: Create `apps/e2e/src/poms/` directory
  - [x] 3.4: Create `login.page.ts` Page Object Model
  - [x] 3.5: Create `dashboard.page.ts` Page Object Model

- [x] Task 4: Create Example E2E Tests (AC: #3)
  - [x] 4.1: Create `apps/e2e/tests/auth/` directory
  - [x] 4.2: Create `login.spec.ts` - successful login flow
  - [x] 4.3: Create `login.spec.ts` - failed login with invalid credentials
  - [x] 4.4: Create `logout.spec.ts` - logout flow
  - [x] 4.5: Verify tests pass locally against dev server

- [x] Task 5: Add Test Scripts (AC: #1)
  - [x] 5.1: Add scripts to `apps/e2e/package.json`: `test`, `test:ui`, `test:debug`
  - [x] 5.2: Add root-level scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:debug`
  - [x] 5.3: Update `turbo.json` if needed (not needed - scripts run via bun --cwd)

- [x] Task 6: CI Integration (AC: #4)
  - [x] 6.1: Add `e2e-tests` job to `.github/workflows/ci.yml`
  - [x] 6.2: Job depends on `preview-deploy` (needs: preview-deploy)
  - [x] 6.3: Pass preview URL as environment variable to Playwright
  - [x] 6.4: Use Playwright Docker image with pre-installed browsers
  - [x] 6.5: Upload test artifacts on failure (screenshots, videos, HTML report)
  - [x] 6.6: Set `continue-on-error: true` initially (don't block PRs)

- [x] Task 7: Documentation (AC: #5)
  - [x] 7.1: Create `apps/e2e/README.md` with usage instructions
  - [x] 7.2: Document running tests locally
  - [x] 7.3: Document writing new tests with POM pattern
  - [x] 7.4: Document CI behavior

### Review Follow-ups (Foundation Improvements)

- [x] Task 8: Create Extended Test Fixture (AC: #2)
  - [x] 8.1: Create `apps/e2e/src/fixtures/test.fixture.ts`
  - [x] 8.2: Extend Playwright's `test` with `loginPage` and `dashboardPage` fixtures
  - [x] 8.3: Add `authenticatedPage` fixture for pre-logged-in context
  - [x] 8.4: Export custom `test` and `expect` for use in spec files

- [x] Task 9: Create Base Page Class (AC: #2)
  - [x] 9.1: Create `apps/e2e/src/poms/base.page.ts` with shared functionality
  - [x] 9.2: Add toast handling methods (`expectSuccessToast`, `expectErrorToast`)
  - [x] 9.3: Add `waitForPageReady()` method
  - [x] 9.4: Update `LoginPage` and `DashboardPage` to extend `BasePage`

- [x] Task 10: Fix Flakiness Risks (AC: #3)
  - [x] 10.1: Add explicit wait after form submission in `LoginPage.login()`
  - [x] 10.2: Add timeout configuration to `playwright.config.ts` (expect, action, navigation)
  - [x] 10.3: Remove hardcoded timeout from `DashboardPage.expectToBeOnDashboard()`

- [x] Task 11: Add Network Utilities (AC: #2)
  - [x] 11.1: Create `apps/e2e/src/utils/network.ts` with API wait helpers
  - [x] 11.2: Add `waitForApiResponse()` utility function
  - [x] 11.3: Add `waitForNetworkSettled()` utility function

- [x] Task 12: Update Tests to Use New Fixtures (AC: #3)
  - [x] 12.1: Refactor `login.spec.ts` to use custom `test` fixture
  - [x] 12.2: Refactor `logout.spec.ts` to use custom `test` fixture and `authenticatedPage`
  - [x] 12.3: Verify all tests still pass

- [x] Task 13: Update Documentation (AC: #5)
  - [x] 13.1: Update README with custom fixture usage
  - [x] 13.2: Document `authenticatedPage` fixture pattern
  - [x] 13.3: Document network utilities

### Foundation Improvements - Phase 2 (Console Error Detection & Cleanup)

- [x] Task 14: Create Console Error Detection Utility (AC: #2)
  - [x] 14.1: Create `apps/e2e/src/utils/console-errors.ts` (utility, not fixture)
  - [x] 14.2: Define `IGNORED_ERRORS` regex array for known acceptable errors
  - [x] 14.3: Create `ConsoleErrorCollector` class with attach(), getErrors(), assertNoErrors(), clear()
  - [x] 14.4: Export both `ConsoleErrorCollector` class and `IGNORED_ERRORS` array (for extension)

- [x] Task 15: Create Console Error Fixture (AC: #2)
  - [x] 15.1: Create `apps/e2e/src/fixtures/console.fixture.ts`
  - [x] 15.2: Import `ConsoleErrorCollector` from `../utils/console-errors`
  - [x] 15.3: Extend Playwright's base `test` with consoleErrors fixture and page override
  - [x] 15.4: Export `test` for use in other fixtures

- [x] Task 16: Extract POM Fixtures to Dedicated File (AC: #2)
  - [x] 16.1: Create `apps/e2e/src/fixtures/pom.fixture.ts`
  - [x] 16.2: Import `test` from `./console.fixture` as base
  - [x] 16.3: Extend with loginPage and dashboardPage POM fixtures

- [x] Task 17: Refactor Test Fixture as Composition Layer (AC: #2)
  - [x] 17.1: Refactor `apps/e2e/src/fixtures/test.fixture.ts`
  - [x] 17.2: Import `test` from `./pom.fixture` and `ConsoleErrorCollector` from utils
  - [x] 17.3: Extend with `authenticatedPage` that reuses the collector utility
  - [x] 17.4: Verify existing imports from tests still work unchanged

- [x] Task 18: Fix Login Methods for Reliability (AC: #3)
  - [x] 18.1: Added `loginAndExpectDashboard()` method - single retriable wait for redirect chain
  - [x] 18.2: Kept `login()` for error case tests (doesn't expect redirect)
  - [x] 18.3: Added `waitForLoadState("networkidle")` before fill to ensure React hydration
  - [x] 18.4: Updated tests to use appropriate method based on expected outcome

- [x] Task 19: Verify Refactoring and Update Documentation (AC: #3, #5)
  - [x] 19.1: Run `bun run test:e2e` locally - all 12 tests pass (Chromium, Firefox, WebKit)
  - [x] 19.2: Console error detection verified working (caught 401 errors, added to IGNORED_ERRORS)
  - [x] 19.3: Login tests pass with `loginAndExpectDashboard()` method
  - [x] 19.4: Biome lint passes
  - [x] 19.5: Updated `apps/e2e/README.md` with console error detection docs and fixture architecture

- [x] Task 20: Exclude E2E from Unit Test Runner (AC: #1)
  - [x] 20.1: Renamed e2e package scripts from `test` to `e2e` to exclude from `turbo test`
  - [x] 20.2: Updated root package.json scripts to use new `e2e` script names
  - [x] 20.3: Updated README with new script names

### Final Fixture Architecture
```
src/
├── utils/
│   ├── network.ts              # Existing network utilities
│   └── console-errors.ts       # NEW: ConsoleErrorCollector class + IGNORED_ERRORS
├── fixtures/
│   ├── auth.fixture.ts         # Test user credentials (unchanged)
│   ├── console.fixture.ts      # NEW: Base fixture with page + consoleErrors
│   ├── pom.fixture.ts          # NEW: Adds loginPage, dashboardPage
│   └── test.fixture.ts         # REFACTORED: Adds authenticatedPage, composes all
└── poms/
    ├── base.page.ts            # Unchanged
    ├── login.page.ts           # FIXED: Strict redirect, no hardcoded timeout
    └── dashboard.page.ts       # Unchanged
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### File List

**New Files:**
- `apps/e2e/package.json` - E2E package with Playwright dependency and workspace dep on @planner/migrate
- `apps/e2e/tsconfig.json` - TypeScript configuration for E2E tests
- `apps/e2e/playwright.config.ts` - Playwright config with multi-browser, baseURL from env, webServer for local dev
- `apps/e2e/.gitignore` - Ignore test artifacts (playwright-report/, test-results/)
- `apps/e2e/README.md` - Documentation for running and writing E2E tests
- `apps/e2e/src/fixtures/auth.fixture.ts` - Auth fixture importing TEST_USERS from @planner/migrate
- `apps/e2e/src/fixtures/console.fixture.ts` - Console error detection fixture (Phase 2)
- `apps/e2e/src/fixtures/pom.fixture.ts` - POM fixtures layer (Phase 2)
- `apps/e2e/src/fixtures/test.fixture.ts` - Extended Playwright test with POM fixtures and authenticatedPage
- `apps/e2e/src/poms/base.page.ts` - Base page class with shared toast handling and page state utilities
- `apps/e2e/src/poms/login.page.ts` - Login page POM extending BasePage
- `apps/e2e/src/poms/dashboard.page.ts` - Dashboard page POM extending BasePage
- `apps/e2e/src/utils/console-errors.ts` - ConsoleErrorCollector utility (Phase 2)
- `apps/e2e/src/utils/network.ts` - Network wait utilities (waitForApiResponse, waitForNetworkSettled)
- `apps/e2e/tests/auth/login.spec.ts` - Login E2E tests using custom fixtures
- `apps/e2e/tests/auth/logout.spec.ts` - Logout E2E tests using authenticatedPage fixture

**Modified Files:**
- `package.json` - Added test:e2e, test:e2e:ui, test:e2e:debug scripts
- `apps/migrate/package.json` - Added exports field for `./seed/test` subpath
- `.github/workflows/ci.yml` - Added e2e-tests job with Playwright Docker container
- `biome.json` - Added playwright-report and test-results to ignore list
- `bun.lock` - Updated lockfile with new E2E dependencies

### Completion Notes List

1. **E2E Application Structure**: Created dedicated `apps/e2e/` package with Playwright, TypeScript config, and workspace dependency on `@planner/migrate` to reuse TEST_USERS.

2. **Playwright Configuration**: Configured multi-browser projects (Chromium, Firefox, WebKit), screenshot/video on failure, baseURL from `PLAYWRIGHT_BASE_URL` env var, and webServer for local dev that starts the web app automatically.

3. **Test Utilities**: Created auth fixture that imports TEST_USERS via workspace package exports. Built Page Object Models for login (with Sonner toast handling) and dashboard (with user menu sign out).

4. **E2E Tests**: Implemented 4 passing tests (1 skipped):
   - Login: successful login redirects to dashboard with welcome message
   - Login: invalid credentials shows error toast
   - Login: unverified user shows appropriate message (SKIPPED - see [#13](https://github.com/vleletko/planner/issues/13))
   - Logout: user can logout from dashboard
   - Logout: after logout, accessing dashboard redirects to login

5. **CI Integration**: Added `e2e-tests` job to CI workflow that runs after `preview-deploy`, installs Chromium, runs tests against preview URL, and uploads artifacts on failure. Set `continue-on-error: true` to not block PRs initially.

6. **Documentation**: Created comprehensive README with local test instructions, POM pattern documentation, and CI behavior explanation.

### Implementation Notes

- **UI Discovery**: Used Chrome DevTools MCP to discover actual UI elements:
  - Button text is "Login" not "Sign In"
  - Errors appear as Sonner toasts (`[data-sonner-toaster]`, `[data-type='error']`) not alerts
  - User menu is a button that opens dropdown with "Sign Out" menuitem
  - Welcome message format is "Welcome {name}"

- **Module Resolution**: Added exports field to `@planner/migrate/package.json` to enable subpath imports (`@planner/migrate/seed/test`)

- **Biome Compliance**: Moved all regex patterns to top-level constants, replaced non-null assertions with helper function that throws

### Change Log

- 2025-12-05: Story created - E2E testing against preview deployments
- 2025-12-05: Story implemented - All 7 tasks completed, 4 E2E tests passing, CI integration added
- 2025-12-05: Code review fixes - Updated stale Dev Notes examples, documented Docker CI, removed dead code
- 2025-12-05: Code review round 2 - Added JUnit reporter for CI, added check-types script, added unverified user test, improved README documentation
- 2025-12-06: Foundation improvements Phase 1 (Party Mode review) - Added 6 new tasks:
  - Task 8: Custom Playwright fixtures (test.fixture.ts) with loginPage, dashboardPage, authenticatedPage
  - Task 9: Base page class (base.page.ts) for shared toast handling and page utilities
  - Task 10: Flakiness fixes - centralized timeouts in config, explicit waits in login()
  - Task 11: Network utilities (network.ts) - waitForApiResponse, waitForNetworkSettled
  - Task 12: Refactored tests to use new fixtures (removed beforeEach login boilerplate)
  - Task 13: Updated README with fixture usage, network utilities documentation
- 2025-12-06: Foundation improvements Phase 2 - Console error detection and fixture architecture:
  - Task 14: Created ConsoleErrorCollector utility with IGNORED_ERRORS pattern matching
  - Task 15: Created console.fixture.ts - base fixture with automatic error detection
  - Task 16: Created pom.fixture.ts - extracted POM fixtures to dedicated layer
  - Task 17: Refactored test.fixture.ts as composition layer
  - Task 18: Fixed WebKit flakiness with loginAndExpectDashboard() and networkidle wait
  - Task 19: All 12 tests pass across Chromium/Firefox/WebKit, README updated
  - Task 20: Renamed e2e scripts to exclude from turbo test runner
- 2025-12-06: Code review fixes:
  - Created GitHub issue #13 for skipped unverified user test (technical debt)
  - Updated test comment with issue reference
  - Fixed README example output to show actual 4 passed/1 skipped
  - Added clarifying comment to authenticatedPage fixture about separate console collector
  - Fixed hardcoded timeout in waitForNetworkSettled() to use Playwright defaults
  - Updated completion notes to reflect accurate test count
- 2025-12-06: Final code review - Story marked Done:
  - Removed broken POM example from README (undefined `page` variable, fragile `expect(page).toHaveURL()` pattern)
  - Added missing `page` and `consoleErrors` fixtures to README Available Fixtures table
  - Removed stale Dev Notes section (300+ lines of planning-time examples superseded by actual implementation)
