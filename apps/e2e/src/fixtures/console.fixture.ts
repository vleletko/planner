import { test as base } from "@playwright/test";
import { ConsoleErrorCollector } from "../utils/console-errors";

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
    await use(page);
    consoleErrors.assertNoErrors();
  },
});

// biome-ignore lint/performance/noBarrelFile: Intentional re-export for test convenience
export { expect } from "@playwright/test";
