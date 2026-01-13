import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

// Top-level regex patterns for performance
const SETTINGS_URL_PATTERN = /\/projects\/[a-z0-9-]+\/settings/;
const PROJECT_KEY_LABEL_PATTERN = /project key/i;
const PROJECT_NAME_LABEL_PATTERN = /project name/i;
const DESCRIPTION_LABEL_PATTERN = /description/i;
const SAVE_BUTTON_PATTERN = /save changes/i;
const SAVED_PATTERN = /saved|updated|success/i;
const LOCKED_PATTERN = /locked/i;
const UNSAVED_CHANGES_PATTERN = /unsaved changes/i;

/**
 * Page Object Model for the project settings page
 */
export class ProjectSettingsPage extends BasePage {
  readonly projectKeyInput: Locator;
  readonly projectNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.projectKeyInput = page.getByLabel(PROJECT_KEY_LABEL_PATTERN);
    this.projectNameInput = page.getByLabel(PROJECT_NAME_LABEL_PATTERN);
    this.descriptionInput = page.getByLabel(DESCRIPTION_LABEL_PATTERN);
    this.saveButton = page.getByRole("button", { name: SAVE_BUTTON_PATTERN });
  }

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}/settings`);
  }

  async expectToBeOnSettingsPage() {
    await expect(this.page).toHaveURL(SETTINGS_URL_PATTERN);
  }

  async expectProjectKeyValue(key: string) {
    await expect(this.projectKeyInput).toHaveValue(key);
  }

  async expectProjectKeyDisabled() {
    await expect(this.projectKeyInput).toBeDisabled();
  }

  async expectProjectKeyReadOnly() {
    // The key field should be both disabled and read-only
    await expect(this.projectKeyInput).toBeDisabled();
    // Also verify the "Locked" indicator is visible
    await expect(this.page.getByText(LOCKED_PATTERN)).toBeVisible();
  }

  async expectProjectNameValue(name: string) {
    await expect(this.projectNameInput).toHaveValue(name);
  }

  async fillProjectName(name: string) {
    await this.projectNameInput.clear();
    await this.projectNameInput.fill(name);
  }

  async fillDescription(description: string) {
    await this.descriptionInput.clear();
    await this.descriptionInput.fill(description);
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async saveAndExpectSuccess() {
    await this.saveButton.click();
    await this.expectSuccessToast(SAVED_PATTERN);
  }

  async expectUnsavedIndicator() {
    await expect(this.page.getByText(UNSAVED_CHANGES_PATTERN)).toBeVisible();
  }

  async expectSaveButtonDisabled() {
    await expect(this.saveButton).toBeDisabled();
  }

  async expectSaveButtonEnabled() {
    await expect(this.saveButton).toBeEnabled();
  }
}
