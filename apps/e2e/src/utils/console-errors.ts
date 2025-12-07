import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Known acceptable errors that should be ignored
export const IGNORED_ERRORS: RegExp[] = [
  /Failed to load resource.*favicon/, // Common favicon 404
  /Failed to load resource.*401/, // Expected 401 during invalid credential tests
  /Failed to load resource.*UNAUTHORIZED/, // Expected 401 during invalid credential tests
  // Add others as discovered
];

/**
 * Collects console errors and page errors during test execution
 */
export class ConsoleErrorCollector {
  private errors: string[] = [];

  attach(page: Page): void {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        this.errors.push(msg.text());
      }
    });
    page.on("pageerror", (error) => {
      this.errors.push(error.message);
    });
  }

  getErrors(): string[] {
    return this.errors.filter(
      (err) => !IGNORED_ERRORS.some((pattern) => pattern.test(err))
    );
  }

  assertNoErrors(): void {
    const realErrors = this.getErrors();
    expect(realErrors, "Console errors detected during test").toEqual([]);
  }

  clear(): void {
    this.errors = [];
  }
}
