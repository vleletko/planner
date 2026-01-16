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
    // Try data-type='success' first, fall back to any toast with the message.
    // Filter by text to avoid strict-mode errors when multiple toasts exist.
    const successToasts = this.toastRegion.locator("[data-type='success']");
    const hasSuccessType = await successToasts.count();

    if (hasSuccessType > 0) {
      const matchingToast = successToasts.filter({ hasText: message }).first();
      await expect(matchingToast).toBeVisible();
      return;
    }

    // Fallback: look for any toast with the message
    await expect(this.toastRegion).toContainText(message);
  }

  async expectErrorToast(message: string | RegExp) {
    // Try data-type='error' first, fall back to any toast with the message.
    // Filter by text to avoid strict-mode errors when multiple toasts exist.
    const errorToasts = this.toastRegion.locator("[data-type='error']");
    const hasErrorType = await errorToasts.count();

    if (hasErrorType > 0) {
      const matchingToast = errorToasts.filter({ hasText: message }).first();
      await expect(matchingToast).toBeVisible();
      return;
    }

    // Fallback: look for any toast with the message
    await expect(this.toastRegion).toContainText(message);
  }
}
