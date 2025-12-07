import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

// Top-level regex patterns for performance
const EMAIL_PATTERN = /email/i;
const PASSWORD_PATTERN = /password/i;
const LOGIN_BUTTON_PATTERN = /^login$/i;
const LOGIN_URL_PATTERN = /auth\/sign-in/;
const DASHBOARD_URL_PATTERN = /dashboard/;

/**
 * Page Object Model for the login page
 *
 * Works with @daveyplate/better-auth-ui AuthView component
 */
export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByLabel(EMAIL_PATTERN);
    this.passwordInput = page.getByLabel(PASSWORD_PATTERN);
    this.submitButton = page.getByRole("button", {
      name: LOGIN_BUTTON_PATTERN,
    });
  }

  async goto() {
    await this.page.goto("/auth/sign-in");
  }

  /**
   * Submit login form without waiting for redirect.
   * Use loginAndExpectDashboard() for successful login flows.
   */
  async login(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submitButton.click();
    // Wait for network to settle (error toast or redirect initiation)
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Login and wait for redirect to dashboard.
   * Single retriable operation that handles complex redirect chains:
   * POST /auth/sign-in → / → /dashboard
   */
  async loginAndExpectDashboard(email: string, password: string) {
    await this.fillCredentials(email, password);
    await this.submitButton.click();
    // Uses navigationTimeout from config - handles full redirect chain
    await this.page.waitForURL(DASHBOARD_URL_PATTERN);
  }

  private async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL(LOGIN_URL_PATTERN);
  }
}
