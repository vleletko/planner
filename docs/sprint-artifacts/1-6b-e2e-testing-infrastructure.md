# Story 1.6b: E2E Testing Infrastructure

Status: ready-for-dev

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

- [ ] Task 1: Create E2E Application Structure (AC: #1)
  - [ ] 1.1: Create `apps/e2e/` directory
  - [ ] 1.2: Initialize `apps/e2e/package.json` with name `@planner/e2e`
  - [ ] 1.3: Install Playwright: `bun add -D @playwright/test`
  - [ ] 1.4: Run `bunx playwright install` to install browsers
  - [ ] 1.5: Create `apps/e2e/tsconfig.json`

- [ ] Task 2: Configure Playwright (AC: #1, #3)
  - [ ] 2.1: Create `apps/e2e/playwright.config.ts`
  - [ ] 2.2: Configure multi-browser projects (Chromium, Firefox, WebKit)
  - [ ] 2.3: Configure screenshots/videos on failure
  - [ ] 2.4: Configure baseURL from environment variable (for preview deployments)
  - [ ] 2.5: Configure webServer for local development

- [ ] Task 3: Create Test Utilities (AC: #2)
  - [ ] 3.1: Create `apps/e2e/src/fixtures/` directory
  - [ ] 3.2: Create `auth.fixture.ts` importing TEST_USERS from `@planner/migrate`
  - [ ] 3.3: Create `apps/e2e/src/poms/` directory
  - [ ] 3.4: Create `login.page.ts` Page Object Model
  - [ ] 3.5: Create `dashboard.page.ts` Page Object Model

- [ ] Task 4: Create Example E2E Tests (AC: #3)
  - [ ] 4.1: Create `apps/e2e/tests/auth/` directory
  - [ ] 4.2: Create `login.spec.ts` - successful login flow
  - [ ] 4.3: Create `login.spec.ts` - failed login with invalid credentials
  - [ ] 4.4: Create `logout.spec.ts` - logout flow
  - [ ] 4.5: Verify tests pass locally against dev server

- [ ] Task 5: Add Test Scripts (AC: #1)
  - [ ] 5.1: Add scripts to `apps/e2e/package.json`: `test`, `test:ui`, `test:debug`
  - [ ] 5.2: Add root-level scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:debug`
  - [ ] 5.3: Update `turbo.json` if needed

- [ ] Task 6: CI Integration (AC: #4)
  - [ ] 6.1: Add `e2e-tests` job to `.github/workflows/ci.yml`
  - [ ] 6.2: Job depends on `preview-deploy` (needs: preview-deploy)
  - [ ] 6.3: Pass preview URL as environment variable to Playwright
  - [ ] 6.4: Install Playwright browsers in CI
  - [ ] 6.5: Upload test artifacts on failure (screenshots, videos, HTML report)
  - [ ] 6.6: Set `continue-on-error: true` initially (don't block PRs)

- [ ] Task 7: Documentation (AC: #5)
  - [ ] 7.1: Create `apps/e2e/README.md` with usage instructions
  - [ ] 7.2: Document running tests locally
  - [ ] 7.3: Document writing new tests with POM pattern
  - [ ] 7.4: Document CI behavior

## Dev Notes

### Existing Infrastructure to Reuse

**Test Users** - Already defined in `apps/migrate/src/seed/test.ts`:
```typescript
export const TEST_USERS = [
  { email: "test@example.com", password: "TestPassword123!", emailVerified: true },
  { email: "admin@example.com", password: "AdminPassword123!", emailVerified: true },
  { email: "demo@example.com", password: "DemoPassword123!", emailVerified: true },
  { email: "unverified@example.com", password: "UnverifiedPassword123!", emailVerified: false },
];
```

**Preview Deployments** - Already configured in CI:
- URL pattern: `https://pr-{PR_NUMBER}.{APP_BASE_DOMAIN}`
- Smoke test already waits for `/api/health` endpoint
- Database is seeded with `SEED_PROFILE=test` in preview environments

### Playwright Configuration

**`apps/e2e/playwright.config.ts`:**
```typescript
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  // Only start local server if not running against preview
  ...(process.env.PLAYWRIGHT_BASE_URL
    ? {}
    : {
        webServer: {
          command: "bun run --cwd ../web dev",
          url: "http://localhost:3001",
          reuseExistingServer: !process.env.CI,
          timeout: 120000,
        },
      }),
});
```

### Page Object Model

**`apps/e2e/src/poms/login.page.ts`:**
```typescript
import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole("button", { name: /sign in/i });
    this.errorMessage = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string | RegExp) {
    await expect(this.errorMessage).toContainText(message);
  }
}
```

### Auth Fixture

**`apps/e2e/src/fixtures/auth.fixture.ts`:**
```typescript
import { TEST_USERS } from "@planner/migrate/src/seed/test";

export { TEST_USERS };

// Convenience exports
export const testUser = TEST_USERS[0]; // test@example.com
export const adminUser = TEST_USERS[1]; // admin@example.com
export const demoUser = TEST_USERS[2]; // demo@example.com
export const unverifiedUser = TEST_USERS[3]; // unverified@example.com
```

### Example E2E Test

**`apps/e2e/tests/auth/login.spec.ts`:**
```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "../../src/poms/login.page";
import { testUser } from "../../src/fixtures/auth.fixture";

test.describe("Login", () => {
  test("successful login redirects to dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(testUser.email, testUser.password);

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
  });

  test("invalid credentials shows error", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login("wrong@example.com", "wrongpassword");

    await loginPage.expectError(/invalid/i);
    await expect(page).toHaveURL(/login/);
  });
});
```

### CI Integration

Add new job to `.github/workflows/ci.yml`:

```yaml
e2e-tests:
  name: E2E Tests
  needs: preview-deploy
  if: github.event_name == 'pull_request' && github.event.action != 'closed'
  runs-on: ubuntu-latest
  timeout-minutes: 30
  continue-on-error: true  # Don't block PRs initially

  steps:
    - name: Checkout code
      uses: actions/checkout@v6

    - name: Setup workspace
      uses: ./.github/actions/setup-bun-workspace

    - name: Install Playwright browsers
      run: bunx playwright install --with-deps chromium

    - name: Run E2E tests
      env:
        PLAYWRIGHT_BASE_URL: https://pr-${{ github.event.pull_request.number }}.${{ secrets.APP_BASE_DOMAIN }}
      run: bun run test:e2e

    - name: Upload test artifacts
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report-pr-${{ github.event.pull_request.number }}
        path: |
          apps/e2e/playwright-report/
          apps/e2e/test-results/
        retention-days: 7
```

**Notes:**
- Only runs Chromium in CI (faster, WebKit/Firefox can be added later)
- `continue-on-error: true` allows PRs to merge even if E2E fails (remove once stable)
- Artifacts are uploaded only on failure to save storage

### Project Structure

```
apps/e2e/
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── README.md
├── src/
│   ├── fixtures/
│   │   └── auth.fixture.ts      # Reuses TEST_USERS from @planner/migrate
│   └── poms/
│       ├── login.page.ts
│       └── dashboard.page.ts
├── tests/
│   └── auth/
│       ├── login.spec.ts
│       └── logout.spec.ts
├── playwright-report/            # Generated HTML report
└── test-results/                 # Screenshots, videos, traces
```

### Scripts

**`apps/e2e/package.json`:**
```json
{
  "name": "@planner/e2e",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug",
    "test:headed": "playwright test --headed"
  }
}
```

**Root `package.json`:**
```json
{
  "scripts": {
    "test:e2e": "bun run --cwd apps/e2e test",
    "test:e2e:ui": "bun run --cwd apps/e2e test:ui",
    "test:e2e:debug": "bun run --cwd apps/e2e test:debug"
  }
}
```

### Running Tests Locally

```bash
# Start dev server in one terminal
bun run dev:web

# Run E2E tests in another terminal
bun run test:e2e

# Or with Playwright UI (interactive)
bun run test:e2e:ui

# Debug mode (step through tests)
bun run test:e2e:debug
```

### References

- [Source: docs/epics/epic-1-foundation-project-infrastructure.md#Story 1.6]
- [Source: apps/migrate/src/seed/test.ts] - Existing test users
- [Source: .github/workflows/ci.yml] - Existing CI with preview deployments
- [Playwright Next.js Guide](https://nextjs.org/docs/pages/guides/testing/playwright)
- [Playwright CI Integration](https://playwright.dev/docs/ci-intro)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

### Change Log

- 2025-12-05: Story created - E2E testing against preview deployments
