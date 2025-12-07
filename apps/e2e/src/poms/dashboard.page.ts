import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

// Top-level regex patterns for performance
const DASHBOARD_HEADING_PATTERN = /^dashboard$/i;
const WELCOME_PATTERN = /welcome/i;
const USER_MENU_PATTERN = /user menu/i;
const SIGN_OUT_PATTERN = /^sign out$/i;
const DASHBOARD_URL_PATTERN = /\/dashboard/;

/**
 * Page Object Model for the dashboard page
 */
export class DashboardPage extends BasePage {
  readonly heading: Locator;
  readonly welcomeMessage: Locator;
  readonly userMenuButton: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole("heading", {
      name: DASHBOARD_HEADING_PATTERN,
    });
    this.welcomeMessage = page.getByText(WELCOME_PATTERN);
    this.userMenuButton = page.getByRole("button", { name: USER_MENU_PATTERN });
  }

  async goto() {
    await this.page.goto("/dashboard");
  }

  async expectToBeOnDashboard() {
    // Uses navigationTimeout from config instead of hardcoded value
    await expect(this.page).toHaveURL(DASHBOARD_URL_PATTERN);
  }

  async expectWelcomeMessage(name?: string) {
    if (name) {
      await expect(this.page.getByText(`Welcome ${name}`)).toBeVisible();
    } else {
      await expect(this.welcomeMessage).toBeVisible();
    }
  }

  async signOut() {
    await this.userMenuButton.click();
    const signOutItem = this.page.getByRole("menuitem", {
      name: SIGN_OUT_PATTERN,
    });
    await signOutItem.waitFor({ state: "visible" });
    await signOutItem.click();
  }
}
