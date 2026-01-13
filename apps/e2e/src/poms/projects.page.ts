import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

// Top-level regex patterns for performance
const PROJECTS_URL_PATTERN = /\/projects$/;
const PROJECT_SETTINGS_URL_PATTERN = /\/projects\/[a-z0-9-]+\/settings$/;
const CREATE_PROJECT_BUTTON_PATTERN = /create.*project|new.*project/i;
const PROJECT_NAME_LABEL_PATTERN = /project name/i;
const PROJECT_KEY_LABEL_PATTERN = /project key/i;
const DESCRIPTION_LABEL_PATTERN = /description/i;
const CREATE_BUTTON_PATTERN = /^create project$/i;
const CREATED_TOAST_PATTERN = /created/i;
const OPEN_PROJECT_PATTERN = /Open project/i;
const CREATE_DIALOG_PATTERN = /create.*project/i;
const KEY_TAKEN_PATTERN = /this key is already taken/i;

/**
 * Page Object Model for the projects list page
 */
export class ProjectsPage extends BasePage {
  readonly createProjectButton: Locator;

  constructor(page: Page) {
    super(page);
    this.createProjectButton = page.getByRole("button", {
      name: CREATE_PROJECT_BUTTON_PATTERN,
    });
  }

  async goto() {
    await this.page.goto("/projects");
  }

  async expectToBeOnProjectsPage() {
    await expect(this.page).toHaveURL(PROJECTS_URL_PATTERN);
  }

  async expectProjectCardVisible(projectKey: string, projectName: string) {
    // Project cards display the key as uppercase text in a span
    const card = this.page.getByRole("button", {
      name: new RegExp(`Open project ${projectName}`, "i"),
    });
    await expect(card).toBeVisible();
    // The project key is displayed in the card - just verify the card is present
    // The card name includes the project key
    await expect(card).toContainText(projectKey);
  }

  async expectProjectCount(count: number) {
    const cards = this.page.getByRole("button", { name: OPEN_PROJECT_PATTERN });
    await expect(cards).toHaveCount(count);
  }

  async clickCreateProject() {
    await this.createProjectButton.click();
  }

  async openCreateDialog() {
    await this.createProjectButton.click();
    // Wait for dialog to be visible
    await expect(
      this.page.getByRole("dialog", { name: CREATE_DIALOG_PATTERN })
    ).toBeVisible();
  }

  async fillProjectForm(name: string, key?: string, description?: string) {
    const nameInput = this.page.getByLabel(PROJECT_NAME_LABEL_PATTERN);
    const keyInput = this.page.getByLabel(PROJECT_KEY_LABEL_PATTERN);

    await nameInput.fill(name);

    // Wait for auto-generated key to appear (dynamic wait instead of fixed timeout)
    await expect(keyInput).not.toHaveValue("");

    // If a custom key is provided, clear and fill it
    if (key) {
      await keyInput.clear();
      await keyInput.fill(key);
    }

    // Blur the key field to trigger validation
    await keyInput.blur();

    if (description) {
      const descriptionInput = this.page.getByLabel(DESCRIPTION_LABEL_PATTERN);
      await descriptionInput.fill(description);
    }
  }

  async submitCreateForm() {
    const submitButton = this.page.getByRole("button", {
      name: CREATE_BUTTON_PATTERN,
    });
    await submitButton.click();
  }

  async createProject(name: string, key?: string, description?: string) {
    await this.fillProjectForm(name, key, description);
    await this.submitCreateForm();
  }

  async expectCreateSuccess() {
    await this.expectSuccessToast(CREATED_TOAST_PATTERN);
    await expect(this.page).toHaveURL(PROJECT_SETTINGS_URL_PATTERN);
  }

  async expectKeyTakenError() {
    await expect(this.page.getByText(KEY_TAKEN_PATTERN)).toBeVisible();
  }

  /**
   * Wait for key validation to complete (loading spinner to disappear)
   */
  async waitForKeyValidation() {
    // Wait for any loading spinner in the key field area to disappear
    const keyFieldContainer = this.page.locator("#project-key").locator("..");
    const spinner = keyFieldContainer.locator(".animate-spin");

    // If spinner is visible, wait for it to disappear
    // Use a short timeout since it may never appear if the check is fast
    try {
      await spinner.waitFor({ state: "visible", timeout: 200 });
      await spinner.waitFor({ state: "hidden", timeout: 5000 });
    } catch {
      // Spinner might not appear if check is very fast, that's OK
    }
  }

  async expectFormKeyError(errorText: string | RegExp) {
    await expect(this.page.getByRole("alert")).toContainText(errorText);
  }

  async clickProject(projectName: string) {
    const card = this.page.getByRole("button", {
      name: new RegExp(`Open project ${projectName}`, "i"),
    });
    await card.click();
  }

  async clickProjectByKey(projectKey: string) {
    // Find the card that contains this project key
    const card = this.page
      .getByRole("button", { name: OPEN_PROJECT_PATTERN })
      .filter({
        hasText: projectKey,
      });
    await card.click();
  }
}
