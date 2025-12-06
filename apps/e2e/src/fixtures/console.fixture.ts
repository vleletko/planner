import { test as base } from "@playwright/test";
import { ConsoleErrorCollector } from "../utils/console-errors";

const HYDRATION_SELECTOR = "body[data-hydrated='true']";

type ConsoleFixtures = {
  consoleErrors: ConsoleErrorCollector;
};

export const test = base.extend<ConsoleFixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright requires destructuring pattern
  consoleErrors: async ({}, use) => {
    const collector = new ConsoleErrorCollector();
    await use(collector);
  },
  page: async ({ page, consoleErrors }, use) => {
    consoleErrors.attach(page);

    // Wrap goto to auto-wait for hydration after navigation
    const originalGoto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await originalGoto(url, options);
      await page.locator(HYDRATION_SELECTOR).waitFor();
      return response;
    };

    await use(page);
    consoleErrors.assertNoErrors();
  },
});

// biome-ignore lint/performance/noBarrelFile: Intentional re-export for test convenience
export { expect } from "@playwright/test";
