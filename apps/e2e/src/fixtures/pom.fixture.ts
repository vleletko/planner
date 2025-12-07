import { DashboardPage } from "../poms/dashboard.page";
import { LoginPage } from "../poms/login.page";
import { test as testWithConsole } from "./console.fixture";

type PomFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
};

export const test = testWithConsole.extend<PomFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

// biome-ignore lint/performance/noBarrelFile: Intentional re-export for test convenience
export { expect } from "@playwright/test";
