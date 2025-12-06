import { testUser, unverifiedUser } from "../../src/fixtures/auth.fixture";
import { test } from "../../src/fixtures/test.fixture";

// Top-level regex patterns for performance
const INVALID_CREDENTIALS_PATTERN = /invalid|incorrect|wrong|user not found/i;
const UNVERIFIED_PATTERN = /email.*verif|verif.*email|not verified/i;

test.describe("Login", () => {
  test("successful login redirects to dashboard", async ({
    loginPage,
    dashboardPage,
  }) => {
    await loginPage.goto();
    // Single retriable wait handles redirect chain: sign-in → / → dashboard
    await loginPage.loginAndExpectDashboard(testUser.email, testUser.password);

    await dashboardPage.expectWelcomeMessage(testUser.name);
  });

  test("invalid credentials shows error toast", async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login("wrong@example.com", "wrongpassword");

    // Should show error toast and stay on login page
    await loginPage.expectErrorToast(INVALID_CREDENTIALS_PATTERN);
    await loginPage.expectToBeOnLoginPage();
  });

  // biome-ignore lint/suspicious/noSkippedTests: App allows unverified users to login - see https://github.com/vleletko/planner/issues/13
  test.skip("unverified user login shows appropriate message", async ({
    loginPage,
  }) => {
    await loginPage.goto();
    await loginPage.login(unverifiedUser.email, unverifiedUser.password);

    // Should show verification required or similar message and stay on login page
    await loginPage.expectErrorToast(UNVERIFIED_PATTERN);
    await loginPage.expectToBeOnLoginPage();
  });
});
