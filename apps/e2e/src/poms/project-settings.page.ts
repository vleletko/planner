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

export const MEMBERS_TAB_PATTERN = /members/i;
export const TEAM_MEMBERS_PATTERN = /team members/i;
export const INVITE_MEMBER_BUTTON_PATTERN = /invite member/i;
const EMAIL_ADDRESS_LABEL_PATTERN = /email address/i;
const SEND_INVITE_BUTTON_PATTERN = /send invite/i;
const ADDED_TO_PROJECT_PATTERN = /added to project/i;
const ROLE_UPDATED_PATTERN = /role updated/i;
const REMOVED_FROM_PROJECT_PATTERN = /removed from project/i;
const INVITE_DIALOG_PATTERN = /invite team member/i;
const CANCEL_BUTTON_PATTERN = /cancel/i;
const MEMBER_ACTIONS_BUTTON_PREFIX = "Actions for ";
const ROLE_ADMIN_OPTION_PATTERN = /admin\s+can manage members/i;
const ROLE_MEMBER_OPTION_PATTERN = /member\s+can view and edit/i;
const REMOVE_FROM_PROJECT_MENU_ITEM_PATTERN = /remove from project/i;
const REMOVE_CONFIRM_BUTTON_PATTERN = /^remove$/i;
const PROMOTE_TO_ADMIN_MENU_ITEM_PATTERN = /promote to admin/i;
const DEMOTE_TO_MEMBER_MENU_ITEM_PATTERN = /demote to member/i;
export const SELECT_NEW_OWNER_LABEL_PATTERN = /select new owner/i;

// Ownership transfer patterns
export const TRANSFER_OWNERSHIP_BUTTON_PATTERN = /transfer ownership/i;
const TRANSFER_OWNERSHIP_DIALOG_PATTERN = /transfer ownership/i;
const CONFIRM_TRANSFER_CHECKBOX_PATTERN = /cannot be undone/i;
const TRANSFER_SUCCESS_PATTERN = /ownership transferred/i;

/**
 * Page Object Model for Project Settings page
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
    // Also verify "Locked" indicator is visible
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

  /**
   * Returns the member row containing the given email.
   * The members list is inside a CardContent with divide-y class.
   */
  private memberRowByEmail(email: string): Locator {
    // Find rows in the members list (CardContent > divide-y container > row divs)
    return this.page
      .locator('[class*="divide-y"] > div.group', {
        has: this.page.getByText(email),
      })
      .first();
  }

  /**
   * Returns the member row containing the given name.
   * Uses the same structure as memberRowByEmail but matches by name.
   */
  private memberRowByName(name: string): Locator {
    return this.page
      .locator('[class*="divide-y"] > div.group', {
        has: this.page.getByText(name, { exact: true }),
      })
      .first();
  }

  async gotoMembersTab(): Promise<void> {
    await this.page.getByRole("tab", { name: MEMBERS_TAB_PATTERN }).click();
    await expect(this.page.getByText(TEAM_MEMBERS_PATTERN)).toBeVisible({
      timeout: 30_000,
    });
  }

  async expectInviteMemberButtonNotVisible(): Promise<void> {
    await expect(
      this.page.getByRole("button", { name: INVITE_MEMBER_BUTTON_PATTERN })
    ).not.toBeVisible();
  }

  private inviteDialog(): Locator {
    return this.page.getByRole("dialog", { name: INVITE_DIALOG_PATTERN });
  }

  async openInviteMemberDialog(): Promise<void> {
    await this.page
      .getByRole("button", { name: INVITE_MEMBER_BUTTON_PATTERN })
      .click();
    await expect(this.inviteDialog()).toBeVisible();
  }

  private async selectInviteCandidateByEmail(
    fragment: string,
    candidateEmail: string,
    role: "member" | "admin"
  ): Promise<void> {
    const dialog = this.inviteDialog();
    await dialog.getByLabel(EMAIL_ADDRESS_LABEL_PATTERN).fill(fragment);

    const candidate = dialog.getByRole("button", {
      name: new RegExp(candidateEmail, "i"),
    });
    await expect(candidate).toBeVisible({ timeout: 30_000 });
    await candidate.click();

    // Explicitly select the role to avoid relying on default state
    const rolePattern =
      role === "admin" ? ROLE_ADMIN_OPTION_PATTERN : ROLE_MEMBER_OPTION_PATTERN;
    await dialog.getByRole("button", { name: rolePattern }).click();
  }

  async submitInviteAndExpectSuccess(): Promise<void> {
    const dialog = this.inviteDialog();
    await dialog
      .getByRole("button", { name: SEND_INVITE_BUTTON_PATTERN })
      .click();
    await this.expectSuccessToast(ADDED_TO_PROJECT_PATTERN);
  }

  async submitInviteExpectingError(message: string | RegExp): Promise<void> {
    const dialog = this.inviteDialog();
    await dialog
      .getByRole("button", { name: SEND_INVITE_BUTTON_PATTERN })
      .click();
    await this.expectInviteDialogError(message);
  }

  async inviteMemberByEmailFragment(
    fragment: string,
    candidateEmail: string,
    role: "member" | "admin" = "member"
  ): Promise<void> {
    await this.openInviteMemberDialog();
    await this.selectInviteCandidateByEmail(fragment, candidateEmail, role);
    await this.submitInviteAndExpectSuccess();
  }

  async inviteExistingMemberExpectingError(
    fragment: string,
    candidateEmail: string,
    message: string | RegExp
  ): Promise<void> {
    await this.openInviteMemberDialog();
    await this.selectInviteCandidateByEmail(fragment, candidateEmail, "member");
    await this.submitInviteExpectingError(message);
  }

  async expectInviteDialogError(message: string | RegExp): Promise<void> {
    await expect(this.inviteDialog().getByText(message)).toBeVisible();
  }

  async closeInviteDialog(): Promise<void> {
    await this.inviteDialog()
      .getByRole("button", { name: CANCEL_BUTTON_PATTERN })
      .click();
    await expect(this.inviteDialog()).not.toBeVisible();
  }

  private memberActionsButton(memberName: string): Locator {
    return this.page.getByRole("button", {
      name: `${MEMBER_ACTIONS_BUTTON_PREFIX}${memberName}`,
    });
  }

  async expectMemberActionsButtonNotVisible(memberName: string): Promise<void> {
    await expect(this.memberActionsButton(memberName)).not.toBeVisible();
  }

  async openMemberActionsMenu(memberName: string): Promise<void> {
    // Hover on the entire member row - this triggers group-hover
    // which makes the actions button visible (it has opacity-0 by default)
    const memberRow = this.memberRowByName(memberName);
    await memberRow.scrollIntoViewIfNeeded();
    await memberRow.hover();

    // Now the button should be visible
    const actionsButton = this.memberActionsButton(memberName);
    await expect(actionsButton).toBeVisible({ timeout: 5000 });
    await actionsButton.click();
  }

  async removeMemberIfPresent(
    email: string,
    memberName: string
  ): Promise<void> {
    const memberEmail = this.page.getByText(email).first();
    if (!(await memberEmail.isVisible())) {
      return;
    }

    await this.openMemberActionsMenu(memberName);
    await this.page
      .getByRole("menuitem", { name: REMOVE_FROM_PROJECT_MENU_ITEM_PATTERN })
      .click();
    await this.page
      .getByRole("button", { name: REMOVE_CONFIRM_BUTTON_PATTERN })
      .click();
    await this.expectSuccessToast(REMOVED_FROM_PROJECT_PATTERN);
    await expect(memberEmail).not.toBeVisible();
  }

  async promoteMemberToAdmin(memberName: string): Promise<void> {
    await this.openMemberActionsMenu(memberName);
    await this.page
      .getByRole("menuitem", { name: PROMOTE_TO_ADMIN_MENU_ITEM_PATTERN })
      .click();
    await this.expectSuccessToast(ROLE_UPDATED_PATTERN);
  }

  async demoteAdminToMember(memberName: string): Promise<void> {
    await this.openMemberActionsMenu(memberName);
    await this.page
      .getByRole("menuitem", { name: DEMOTE_TO_MEMBER_MENU_ITEM_PATTERN })
      .click();
    await this.expectSuccessToast(ROLE_UPDATED_PATTERN);
  }

  async expectMemberRole(
    memberEmail: string,
    role: "Owner" | "Admin" | "Member"
  ): Promise<void> {
    const row = this.memberRowByEmail(memberEmail);
    const badge = row.locator("[data-slot='badge']:visible", { hasText: role });
    await expect(badge).toBeVisible();
  }

  async expectMemberRoleNotVisible(
    memberEmail: string,
    role: "Owner" | "Admin" | "Member"
  ): Promise<void> {
    const row = this.memberRowByEmail(memberEmail);
    const badge = row.locator("[data-slot='badge']:visible", { hasText: role });
    await expect(badge).toHaveCount(0);
  }

  isMemberListed(memberEmail: string): Promise<boolean> {
    return this.page.getByText(memberEmail).first().isVisible();
  }

  // Ownership transfer dialog methods
  transferOwnershipDialog(): Locator {
    return this.page.getByRole("dialog", {
      name: TRANSFER_OWNERSHIP_DIALOG_PATTERN,
    });
  }

  async openTransferOwnershipDialogForMember(
    memberName: string
  ): Promise<void> {
    await this.openMemberActionsMenu(memberName);

    await this.page
      .getByRole("menuitem", { name: TRANSFER_OWNERSHIP_BUTTON_PATTERN })
      .click();

    await expect(this.transferOwnershipDialog()).toBeVisible();
  }

  async selectNewOwner(memberName: string): Promise<void> {
    const dialog = this.transferOwnershipDialog();
    await dialog
      .getByRole("combobox", { name: SELECT_NEW_OWNER_LABEL_PATTERN })
      .click();

    // Listbox is rendered as portal outside dialog, search on page level
    const option = this.page.getByRole("option", {
      name: new RegExp(memberName, "i"),
    });
    await expect(option).toBeVisible();
    await option.click();
  }

  async checkTransferConfirmation(): Promise<void> {
    const dialog = this.transferOwnershipDialog();
    await dialog
      .getByRole("checkbox", { name: CONFIRM_TRANSFER_CHECKBOX_PATTERN })
      .check();
  }

  async submitTransfer(): Promise<void> {
    const dialog = this.transferOwnershipDialog();
    await dialog
      .getByRole("button", { name: TRANSFER_OWNERSHIP_BUTTON_PATTERN })
      .click();
    await expect(this.transferOwnershipDialog()).not.toBeVisible();
  }

  async expectTransferSuccess(newOwnerName?: string): Promise<void> {
    const pattern = newOwnerName
      ? new RegExp(`ownership transferred to ${newOwnerName}`, "i")
      : TRANSFER_SUCCESS_PATTERN;
    await this.expectSuccessToast(pattern);
  }

  async closeTransferOwnershipDialog(): Promise<void> {
    const dialog = this.transferOwnershipDialog();
    await dialog.getByRole("button", { name: CANCEL_BUTTON_PATTERN }).click();
    await expect(dialog).not.toBeVisible();
  }

  async expectTransferSubmitButtonDisabled(): Promise<void> {
    const dialog = this.transferOwnershipDialog();
    await expect(
      dialog.getByRole("button", { name: TRANSFER_OWNERSHIP_BUTTON_PATTERN })
    ).toBeDisabled();
  }

  async expectTransferSubmitButtonEnabled(): Promise<void> {
    const dialog = this.transferOwnershipDialog();
    await expect(
      dialog.getByRole("button", { name: TRANSFER_OWNERSHIP_BUTTON_PATTERN })
    ).toBeEnabled();
  }

  async expectMemberInTransferDropdown(memberName: string): Promise<void> {
    const dialog = this.transferOwnershipDialog();
    await dialog
      .getByRole("combobox", { name: SELECT_NEW_OWNER_LABEL_PATTERN })
      .click();
    // Listbox is rendered as portal outside dialog, search on page level
    await expect(
      this.page.getByRole("option", { name: new RegExp(memberName, "i") })
    ).toBeVisible();
    await this.page.keyboard.press("Escape");
  }

  async expectMemberNotInTransferDropdown(memberName: string): Promise<void> {
    const dialog = this.transferOwnershipDialog();
    await dialog
      .getByRole("combobox", { name: SELECT_NEW_OWNER_LABEL_PATTERN })
      .click();
    // Listbox is rendered as portal outside dialog, search on page level
    await expect(
      this.page.getByRole("option", { name: new RegExp(memberName, "i") })
    ).not.toBeVisible();
    await this.page.keyboard.press("Escape");
  }

  async getTransferableOptionsCount(): Promise<number> {
    const dialog = this.transferOwnershipDialog();
    await dialog
      .getByRole("combobox", { name: SELECT_NEW_OWNER_LABEL_PATTERN })
      .click();
    // Listbox is rendered as portal outside dialog, search on page level
    const count = await this.page.getByRole("option").count();
    await this.page.keyboard.press("Escape");
    return count;
  }

  async expectTransferOwnershipMenuItemVisible(
    memberName: string
  ): Promise<void> {
    await this.openMemberActionsMenu(memberName);

    await expect(
      this.page.getByRole("menuitem", {
        name: TRANSFER_OWNERSHIP_BUTTON_PATTERN,
      })
    ).toBeVisible({ timeout: 10_000 });

    await this.page.keyboard.press("Escape");
  }

  async expectTransferOwnershipMenuItemNotVisible(
    memberName: string
  ): Promise<void> {
    await this.openMemberActionsMenu(memberName);

    await expect(
      this.page.getByRole("menuitem", {
        name: TRANSFER_OWNERSHIP_BUTTON_PATTERN,
      })
    ).not.toBeVisible();

    await this.page.keyboard.press("Escape");
  }
}
