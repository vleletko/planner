import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";
const WEB_SERVER_TIMEOUT_MS = 120_000;

// Timeout configuration - centralized, no magic numbers in tests
const EXPECT_TIMEOUT_MS = 10_000;
const ACTION_TIMEOUT_MS = 15_000;
const NAVIGATION_TIMEOUT_MS = 30_000;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
    ...(process.env.CI
      ? [["junit", { outputFile: "junit.xml" }] as const]
      : []),
  ],

  // Centralized timeout configuration
  expect: { timeout: EXPECT_TIMEOUT_MS },
  timeout: 60_000, // test timeout

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: ACTION_TIMEOUT_MS,
    navigationTimeout: NAVIGATION_TIMEOUT_MS,
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
          timeout: WEB_SERVER_TIMEOUT_MS,
        },
      }),
});
