import type { Page } from "@playwright/test";
import { LoginPage } from "../poms/login.page";
import { ConsoleErrorCollector } from "../utils/console-errors";
import { testUser } from "./auth.fixture";
import { test as testWithPoms } from "./pom.fixture";

type AuthenticatedFixtures = {
  authenticatedPage: Page;
};

export const test = testWithPoms.extend<AuthenticatedFixtures>({
  // Pre-authenticated context - login happens in fixture setup
  // Uses separate browser context with its own console error collector
  // (independent from the `page` fixture's collector)
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Attach console error collection to this separate context
    const collector = new ConsoleErrorCollector();
    collector.attach(page);

    // Perform login with single retriable wait for redirect chain
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndExpectDashboard(testUser.email, testUser.password);

    await use(page);

    // Assert no console errors after test completes
    collector.assertNoErrors();
    await context.close();
  },
});

// biome-ignore lint/performance/noBarrelFile: Intentional re-export for test convenience
export { expect } from "@playwright/test";
