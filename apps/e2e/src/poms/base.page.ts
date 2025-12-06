import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Base class for all Page Object Models
 * Provides shared functionality for toast handling and page state management
 */
export abstract class BasePage {
  readonly toastRegion: Locator;
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
    this.toastRegion = page.locator("[data-sonner-toaster]");
  }

  async waitForPageReady() {
    await this.page.waitForLoadState("domcontentloaded");
  }

  async expectSuccessToast(message: string | RegExp) {
    const toast = this.toastRegion.locator("[data-type='success']");
    await expect(toast).toContainText(message);
  }

  async expectErrorToast(message: string | RegExp) {
    const toast = this.toastRegion.locator("[data-type='error']");
    await expect(toast).toContainText(message);
  }
}
