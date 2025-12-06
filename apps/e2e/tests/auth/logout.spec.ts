import { expect, test } from "../../src/fixtures/test.fixture";
import { DashboardPage } from "../../src/poms/dashboard.page";
import { LoginPage } from "../../src/poms/login.page";

// Top-level regex patterns for performance
const POST_LOGOUT_URL_PATTERN = /auth\/sign-in|\/$/;

test.describe("Logout", () => {
  // Uses authenticatedPage fixture - already logged in
  test("user can logout from dashboard", async ({ authenticatedPage }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);

    await dashboardPage.signOut();

    // Should redirect to login page or home after logout
    await expect(authenticatedPage).toHaveURL(POST_LOGOUT_URL_PATTERN);
  });

  test("after logout, accessing dashboard redirects to login", async ({
    authenticatedPage,
  }) => {
    const dashboardPage = new DashboardPage(authenticatedPage);
    const loginPage = new LoginPage(authenticatedPage);

    await dashboardPage.signOut();

    // Wait for logout to complete
    await expect(authenticatedPage).toHaveURL(POST_LOGOUT_URL_PATTERN);

    // Try to access dashboard directly
    await authenticatedPage.goto("/dashboard");

    // Should be redirected to login
    await loginPage.expectToBeOnLoginPage();
  });
});
