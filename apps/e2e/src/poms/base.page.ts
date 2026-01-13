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

  async expectSuccessToast(message: string | RegExp) {
    // Try data-type='success' first, fall back to any toast with the message
    const successToast = this.toastRegion.locator("[data-type='success']");
    const hasSuccessType = await successToast.count();
    if (hasSuccessType > 0) {
      await expect(successToast).toContainText(message);
    } else {
      // Fallback: look for any toast with the message
      await expect(this.toastRegion).toContainText(message);
    }
  }

  async expectErrorToast(message: string | RegExp) {
    // Try data-type='error' first, fall back to any toast with the message
    const errorToast = this.toastRegion.locator("[data-type='error']");
    const hasErrorType = await errorToast.count();
    if (hasErrorType > 0) {
      await expect(errorToast).toContainText(message);
    } else {
      // Fallback: look for any toast with the message
      await expect(this.toastRegion).toContainText(message);
    }
  }
}
