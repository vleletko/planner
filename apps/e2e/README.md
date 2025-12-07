# E2E Tests

End-to-end tests for the Planner application using [Playwright](https://playwright.dev/).

## Prerequisites

- Bun 1.3.1+
- Playwright browsers installed (`bunx playwright install`)

## Running Tests Locally

### Quick Start

```bash
# Start dev server in one terminal
bun run dev:web

# Run E2E tests in another terminal
bun run test:e2e
```

### Test Commands

From the repository root:

| Command | Description |
|---------|-------------|
| `bun run test:e2e` | Run all E2E tests headless |
| `bun run test:e2e:ui` | Interactive UI mode (recommended for debugging) |
| `bun run test:e2e:debug` | Debug mode with step-through |

From `apps/e2e/`:

| Command | Description |
|---------|-------------|
| `bun run e2e` | Run tests headless |
| `bun run e2e:ui` | Interactive UI mode |
| `bun run e2e:debug` | Debug mode |
| `bun run e2e:headed` | Run tests with visible browser |

### Running Against Different Environments

```bash
# Run against local dev server (default)
bun run test:e2e

# Run against a preview deployment
PLAYWRIGHT_BASE_URL=https://pr-123.example.com bun run test:e2e

# Run against production (be careful!)
PLAYWRIGHT_BASE_URL=https://app.example.com bun run test:e2e
```

## Project Structure

```
apps/e2e/
├── package.json
├── playwright.config.ts      # Playwright configuration
├── tsconfig.json
├── README.md
├── src/
│   ├── fixtures/
│   │   ├── auth.fixture.ts   # Test user credentials
│   │   ├── console.fixture.ts # Console error detection fixture
│   │   ├── pom.fixture.ts    # POM fixtures (loginPage, dashboardPage)
│   │   └── test.fixture.ts   # Main test fixture (composes all fixtures)
│   ├── poms/
│   │   ├── base.page.ts      # Base class for all POMs
│   │   ├── login.page.ts     # Login Page Object Model
│   │   └── dashboard.page.ts # Dashboard Page Object Model
│   └── utils/
│       ├── console-errors.ts # ConsoleErrorCollector utility
│       └── network.ts        # Network wait utilities
├── tests/
│   └── auth/
│       ├── login.spec.ts     # Login flow tests
│       └── logout.spec.ts    # Logout flow tests
├── playwright-report/        # Generated HTML report (gitignored)
└── test-results/             # Screenshots, videos (gitignored)
```

## Writing New Tests

### Using Custom Test Fixtures (Recommended)

This project uses custom Playwright fixtures for cleaner test code. Import from our fixture instead of `@playwright/test`:

```typescript
import { test, expect } from "../../src/fixtures/test.fixture";
import { testUser } from "../../src/fixtures/auth.fixture";

// POMs are automatically available as fixtures
test("user can login", async ({ loginPage, dashboardPage }) => {
  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);

  await dashboardPage.expectToBeOnDashboard();
});

// For tests that need an authenticated user
test("user can access protected feature", async ({ authenticatedPage }) => {
  // Already logged in - start testing immediately
  const dashboardPage = new DashboardPage(authenticatedPage);
  await dashboardPage.expectToBeOnDashboard();
});
```

### Available Fixtures

| Fixture | Description |
|---------|-------------|
| `page` | Playwright Page with console error detection |
| `consoleErrors` | ConsoleErrorCollector instance for custom assertions |
| `loginPage` | Pre-instantiated LoginPage POM |
| `dashboardPage` | Pre-instantiated DashboardPage POM |
| `authenticatedPage` | Page already logged in as test user |

### Creating a New Page Object Model

1. Create a file in `src/poms/` (e.g., `my-feature.page.ts`)
2. Extend `BasePage` for shared functionality (toast handling, page state):

```typescript
import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class MyFeaturePage extends BasePage {
  readonly someButton: Locator;

  constructor(page: Page) {
    super(page); // BasePage provides toast handling
    // Use accessible selectors when possible
    this.someButton = page.getByRole("button", { name: /submit/i });
  }

  async goto() {
    await this.page.goto("/my-feature");
  }

  async clickSubmit() {
    await this.someButton.click();
  }

  async submitAndExpectSuccess() {
    await this.someButton.click();
    // Toast handling inherited from BasePage
    await this.expectSuccessToast(/saved/i);
  }
}
```

### Network Utilities

For tests that need to wait for API responses:

```typescript
import { waitForApiResponse } from "../../src/utils/network";

test("create task waits for API", async ({ authenticatedPage }) => {
  // Wait for API call to complete alongside the action
  await Promise.all([
    waitForApiResponse(authenticatedPage, /\/api\/tasks/, { method: "POST" }),
    createButton.click(),
  ]);
});
```

### Console Error Detection

Tests automatically fail if console errors are detected during execution. This catches runtime errors, unhandled promise rejections, and other issues that might otherwise go unnoticed.

**How it works:**
- The `console.fixture.ts` attaches listeners for `console.error` and `pageerror` events
- After each test, it asserts no unexpected errors occurred
- Known acceptable errors (like 401 during invalid login) are filtered via `IGNORED_ERRORS` in `console-errors.ts`

**Adding ignored patterns:**

```typescript
// src/utils/console-errors.ts
export const IGNORED_ERRORS: RegExp[] = [
  /Failed to load resource.*favicon/,
  /Failed to load resource.*401/,
  // Add your pattern here
];
```

### Fixture Architecture

Fixtures are composed in layers for flexibility:

```
console.fixture.ts  → Base: adds consoleErrors + page with error detection
       ↓
pom.fixture.ts      → Adds: loginPage, dashboardPage
       ↓
test.fixture.ts     → Adds: authenticatedPage (pre-logged-in context)
```

Import from `test.fixture.ts` to get all fixtures. For custom fixtures, you can extend any layer.

### Best Practices

1. **Use accessible selectors**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS/XPath
2. **One assertion per test**: Keep tests focused and easy to debug
3. **Use POMs**: Encapsulate page interactions to reduce duplication
4. **Use fixtures**: Define test data in `src/fixtures/` for reusability
5. **Use `loginAndExpectDashboard()`**: For successful login flows, this single retriable operation handles complex redirect chains
6. **Wait for hydration**: Before filling inputs, wait for `networkidle` to ensure React hydration is complete

## Test Users

Test users are defined in `src/fixtures/auth.fixture.ts` and match the seed data from `@planner/migrate`:

| User | Email | Verified |
|------|-------|----------|
| `testUser` | test@example.com | Yes |
| `adminUser` | admin@example.com | Yes |
| `demoUser` | demo@example.com | Yes |
| `unverifiedUser` | unverified@example.com | No |

These users are seeded when `SEED_PROFILE=test` is used (dev, preview, e2e environments).

## CI Integration

E2E tests run automatically on PRs after the preview deployment succeeds:

1. Preview is deployed to `https://pr-{number}.{APP_BASE_DOMAIN}`
2. E2E tests run inside the official Playwright Docker image (`mcr.microsoft.com/playwright:v1.57.0-noble`)
3. Tests run against the preview URL with Chromium only (faster)
4. Failures are reported but don't block PR merge (initially)
5. Test artifacts (screenshots, videos) are uploaded on failure

**Why Docker?** The official Playwright image has all browser dependencies pre-installed, eliminating the slow and sometimes flaky `playwright install --with-deps` step. This provides consistent browser versions and faster CI execution.

### Viewing Test Artifacts

On test failure, artifacts are uploaded to GitHub Actions:

1. Go to the failed workflow run
2. Find "Artifacts" section at the bottom
3. Download `playwright-report-pr-{number}`
4. Open `playwright-report/index.html` for the HTML report

## Configuration

### playwright.config.ts

Key settings:

| Setting | Local | CI |
|---------|-------|-----|
| `workers` | Auto | 1 |
| `retries` | 0 | 2 |
| `screenshot` | On failure | On failure |
| `video` | On failure | On failure |
| `trace` | On first retry | On first retry |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PLAYWRIGHT_BASE_URL` | Base URL for tests | `http://localhost:3001` |
| `CI` | Enables CI mode | - |

### Timeout Strategy

All timeouts are centralized in `playwright.config.ts` to avoid magic numbers in tests:

| Timeout | Value | Purpose |
|---------|-------|---------|
| Web server startup | 120s | Time to wait for dev server to start |
| Test timeout | 60s | Maximum time for a single test |
| Expect timeout | 10s | Maximum time for assertions |
| Action timeout | 15s | Maximum time for each action (click, fill) |
| Navigation timeout | 30s | Maximum time for page navigation and redirect chains |

Timeouts can be adjusted in `playwright.config.ts` or per-test using `test.setTimeout()`.

## Example Test Output

### Passing Tests

```
Running X tests using Y workers

  ✓  [chromium] › tests/auth/login.spec.ts › Login › successful login redirects to dashboard
  ✓  [chromium] › tests/auth/login.spec.ts › Login › invalid credentials shows error toast
  ✓  [chromium] › tests/auth/logout.spec.ts › Logout › user can logout from dashboard
  ...

  X passed (Xs)
```

### Failing Tests

```
  ✘  [chromium] › tests/auth/login.spec.ts › Login › successful login redirects to dashboard

  Error: Timed out waiting for URL to match /dashboard/

  Screenshot: test-results/login-Login-successful-login-chromium/test-failed-1.png
```

On failure, check:
1. The screenshot in `test-results/`
2. The HTML report: `bunx playwright show-report`
3. Run with `--debug` for step-through debugging

## Troubleshooting

### Tests hang on local

Make sure the dev server is running:

```bash
bun run dev:web
```

Or let Playwright start it automatically (configured in `playwright.config.ts`).

### Tests fail with "Element not found"

1. Run in UI mode to see what's happening: `bun run test:e2e:ui`
2. Check if selectors match the actual page elements
3. Add explicit waits if elements load asynchronously

### Browser not installed

```bash
bunx playwright install
```
