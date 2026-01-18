import { TEST_PROJECTS } from "@planner/migrate/seed/projects";
import type { Browser, BrowserContext, Page } from "@playwright/test";
import { adminUser, demoUser, testUser } from "../../src/fixtures/auth.fixture";
import { expect, test } from "../../src/fixtures/test.fixture";
import { LoginPage } from "../../src/poms/login.page";
import { ProjectSettingsPage } from "../../src/poms/project-settings.page";
import { ProjectsPage } from "../../src/poms/projects.page";

// Seed data for test@example.com user
const userProjects = TEST_PROJECTS.filter(
  (p) => p.ownerEmail === testUser.email
);

// Projects where test user is a member (not owner) - for testing read-only access
const memberProjects = TEST_PROJECTS.filter(
  (p) =>
    p.ownerEmail !== testUser.email &&
    p.members?.some((m) => m.email === testUser.email)
);

// Regex patterns
const BACK_TO_PROJECTS_REGEX = /back to projects/i;
const VIEW_ONLY_ACCESS_REGEX = /view-only access/i;
const SAVE_BUTTON_REGEX = /save/i;
const PROJECT_NAME_LABEL_REGEX = /project name/i;
const PROJECT_KEY_LABEL_REGEX = /project key/i;
const KEY_FORMAT_ERROR_REGEX = /must start with a letter|uppercase letters/i;
const PROJECT_SETTINGS_URL_ID_REGEX = /\/projects\/([^/]+)\/settings/;
const ERROR_LOADING_SETTINGS_REGEX = /error loading settings/i;

const NO_PROJECT_ACCESS_MESSAGE =
  "You don't have access to this project. Contact project owner.";

const PERMISSION_DENIED_REGEX = /don't have permission/i;
const USER_ALREADY_MEMBER_REGEX = /already a member/i;
const USER_NOT_FOUND_REGEX = /user not found/i;
const CANNOT_REMOVE_OWNER_REGEX = /project owner/i;
const CANNOT_REMOVE_SELF_REGEX = /cannot remove yourself/i;

// Ownership transfer validation patterns
const TRANSFER_TO_SELF_REGEX = /cannot transfer ownership to yourself/i;
const TRANSFER_TO_NON_MEMBER_REGEX = /not a member of this project/i;

/**
 * Generate a unique project name that produces a unique auto-generated key.
 * Uses timestamp bits to derive unique starting letters for each word,
 * giving us 26^6 = 308 million possible key combinations.
 */
function generateUniqueProjectName(): string {
  const ts = Date.now();
  // Generate 6 unique letters by using different bits of the timestamp
  const chars = [
    String.fromCharCode(65 + (ts % 26)),
    String.fromCharCode(65 + (Math.floor(ts / 26) % 26)),
    String.fromCharCode(65 + (Math.floor(ts / 676) % 26)),
    String.fromCharCode(65 + (Math.floor(ts / 17_576) % 26)),
    String.fromCharCode(65 + (Math.floor(ts / 456_976) % 26)),
    String.fromCharCode(65 + (Math.floor(ts / 11_881_376) % 26)),
  ];
  // Create words starting with each letter (key generator takes first letter of each word)
  return chars.map((c, i) => `${c}word${i}`).join(" ");
}

function createProjectsPage(page: Page): ProjectsPage {
  return new ProjectsPage(page);
}

async function gotoProjectsList(projectsPage: ProjectsPage): Promise<void> {
  await projectsPage.goto();
}

async function openCreateProjectDialog(page: Page): Promise<ProjectsPage> {
  const projectsPage = createProjectsPage(page);
  await gotoProjectsList(projectsPage);
  await projectsPage.openCreateDialog();

  return projectsPage;
}

test.describe("Projects List", () => {
  test("displays seeded projects for logged in user", async ({
    authenticatedPage,
  }) => {
    const projectsPage = createProjectsPage(authenticatedPage);
    await gotoProjectsList(projectsPage);

    // Verify the page loads
    await projectsPage.expectToBeOnProjectsPage();

    // Verify seeded project keys are visible (names may have changed in previous runs)
    // Use first() because the key may appear in multiple places on the card
    for (const project of userProjects) {
      await expect(
        authenticatedPage.getByText(project.key, { exact: true }).first()
      ).toBeVisible();
    }
  });

  test("shows create project button", async ({ authenticatedPage }) => {
    const projectsPage = createProjectsPage(authenticatedPage);
    await gotoProjectsList(projectsPage);

    await expect(projectsPage.createProjectButton).toBeVisible();
  });
});

test.describe("Project Creation", () => {
  test("can create a new project with auto-generated key", async ({
    authenticatedPage,
  }) => {
    const projectsPage = await openCreateProjectDialog(authenticatedPage);

    // Use a unique multi-word name that generates a unique auto-generated key
    // Each word starts with a letter derived from timestamp bits, giving 26^6 combinations
    const uniqueName = generateUniqueProjectName();
    await projectsPage.fillProjectForm(uniqueName);

    // Wait for key validation to complete
    await projectsPage.waitForKeyValidation();

    // Submit form
    await projectsPage.submitCreateForm();

    // Verify success
    await projectsPage.expectCreateSuccess();
  });

  test("can create a project with custom key", async ({
    authenticatedPage,
  }) => {
    const projectsPage = await openCreateProjectDialog(authenticatedPage);

    // Fill form with custom key - use X prefix which is rarely used
    const uniqueKey = `X${Date.now().toString().slice(-5)}`;
    const uniqueName = `Custom Key Project ${Date.now()}`;
    await projectsPage.fillProjectForm(
      uniqueName,
      uniqueKey,
      "A project with a custom key"
    );

    // Wait for key validation to complete
    await projectsPage.waitForKeyValidation();

    // Submit form
    await projectsPage.submitCreateForm();

    // Verify success
    await projectsPage.expectCreateSuccess();
  });

  test("shows error for duplicate project key", async ({
    authenticatedPage,
  }) => {
    const projectsPage = await openCreateProjectDialog(authenticatedPage);

    // Try to use an existing key (MKT from seed data)
    const existingKey = userProjects[0]?.key ?? "MKT";
    await projectsPage.fillProjectForm("Duplicate Key Test", existingKey);

    // Wait for key validation to complete
    await projectsPage.waitForKeyValidation();

    // Verify error is shown
    await projectsPage.expectKeyTakenError();
  });

  test("shows error for invalid key format", async ({ authenticatedPage }) => {
    await openCreateProjectDialog(authenticatedPage);

    // Enter a name first
    const nameInput = authenticatedPage.getByLabel(PROJECT_NAME_LABEL_REGEX);
    await nameInput.fill("Test Project");

    // Enter a key starting with a number (invalid format)
    const keyInput = authenticatedPage.getByLabel(PROJECT_KEY_LABEL_REGEX);
    await keyInput.clear();
    await keyInput.fill("1ABC");
    await keyInput.blur();

    // Verify format error is shown
    await expect(
      authenticatedPage.getByText(KEY_FORMAT_ERROR_REGEX)
    ).toBeVisible();
  });
});

type UserCredentials = { email: string; password: string };

async function newLoggedInPage(
  browser: Browser,
  user: UserCredentials
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAndExpectDashboard(user.email, user.password);

  return { context, page };
}

function projectIdFromSettingsUrl(projectUrl: string): string {
  const match = projectUrl.match(PROJECT_SETTINGS_URL_ID_REGEX);
  if (!match?.[1]) {
    throw new Error(`Could not parse projectId from URL: ${projectUrl}`);
  }

  return match[1];
}

async function expectProjectSettingsAccessDenied(page: Page): Promise<void> {
  // Wait for the settings error UI to render (dev server may compile on first hit).
  await expect(
    page.getByRole("heading", { name: ERROR_LOADING_SETTINGS_REGEX })
  ).toBeVisible({ timeout: 30_000 });

  await expect(
    page.getByText(NO_PROJECT_ACCESS_MESSAGE, { exact: true })
  ).toBeVisible();

  // Ensure the user has a way out.
  await expect(
    page.getByRole("button", { name: BACK_TO_PROJECTS_REGEX })
  ).toBeVisible();
}

function firstUserProjectOrThrow() {
  const project = userProjects[0];
  if (!project) {
    throw new Error("No seeded projects found for test user");
  }

  return project;
}

async function openProjectSettingsByKey(
  page: Page,
  projectKey: string
): Promise<{
  projectsPage: ProjectsPage;
  projectSettingsPage: ProjectSettingsPage;
}> {
  const projectsPage = new ProjectsPage(page);
  const projectSettingsPage = new ProjectSettingsPage(page);

  await projectsPage.goto();
  await projectsPage.clickProjectByKey(projectKey);
  await projectSettingsPage.expectToBeOnSettingsPage();

  return { projectsPage, projectSettingsPage };
}

async function openFirstUserProjectSettings(page: Page): Promise<{
  project: (typeof userProjects)[number];
  projectSettingsPage: ProjectSettingsPage;
}> {
  const project = firstUserProjectOrThrow();
  const { projectSettingsPage } = await openProjectSettingsByKey(
    page,
    project.key
  );

  return { project, projectSettingsPage };
}

async function createTestProject(
  page: Page,
  options?: {
    projectName?: string;
    addDemoUserAs?: "admin" | "member" | "none";
  }
): Promise<{
  projectId: string;
  projectName: string;
  projectSettingsPage: ProjectSettingsPage;
}> {
  const projectsPage = await openCreateProjectDialog(page);
  const projectName = options?.projectName || generateUniqueProjectName();
  await projectsPage.fillProjectForm(projectName);
  await projectsPage.waitForKeyValidation();
  await projectsPage.submitCreateForm();
  await projectsPage.expectCreateSuccess();

  const projectSettingsPage = new ProjectSettingsPage(page);

  if (
    options?.addDemoUserAs === "admin" ||
    options?.addDemoUserAs === "member"
  ) {
    await projectSettingsPage.gotoMembersTab();
    await projectSettingsPage.inviteMemberByEmailFragment(
      "demo",
      demoUser.email,
      options.addDemoUserAs
    );
  }

  const settingsUrl = page.url();
  const match = settingsUrl.match(PROJECT_SETTINGS_URL_ID_REGEX);
  if (!match?.[1]) {
    throw new Error(`Could not parse projectId from URL: ${settingsUrl}`);
  }

  return {
    projectId: match[1],
    projectName,
    projectSettingsPage,
  };
}

async function deleteProject(page: Page, projectId: string): Promise<void> {
  const res = await callRpc(page, "/api/rpc/projects/delete", { projectId });
  if (!res.ok) {
    throw new Error(`Failed to delete project: ${JSON.stringify(res.body)}`);
  }
}

function getProjectId(page: Page): string {
  const settingsUrl = page.url();
  const match = settingsUrl.match(PROJECT_SETTINGS_URL_ID_REGEX);
  if (!match?.[1]) {
    throw new Error(`Could not parse projectId from URL: ${settingsUrl}`);
  }
  return match[1];
}

test.describe("Project Ownership Transfer", () => {
  test.describe("UI Visibility", () => {
    test("owner can access transfer ownership from member dropdown", async ({
      authenticatedPage,
    }) => {
      const { projectSettingsPage } = await createTestProject(
        authenticatedPage,
        { addDemoUserAs: "member" }
      );

      await projectSettingsPage.openTransferOwnershipDialogForMember(
        demoUser.name
      );
      await projectSettingsPage.closeTransferOwnershipDialog();

      await deleteProject(
        authenticatedPage,
        await getProjectId(authenticatedPage)
      );
    });

    test("admin does not see transfer ownership button", async ({
      authenticatedPage,
      browser,
    }) => {
      // Create a fresh project with demoUser as admin and adminUser as member
      const { projectSettingsPage, projectId } = await createTestProject(
        authenticatedPage,
        { addDemoUserAs: "admin" }
      );

      // Add adminUser as a regular member so the admin has someone to act on
      await projectSettingsPage.inviteMemberByEmailFragment(
        "admin@",
        adminUser.email,
        "member"
      );

      // Login as demoUser (admin)
      const demoContext = await browser.newContext();
      const demoPage = await demoContext.newPage();
      const demoLoginPage = new LoginPage(demoPage);
      await demoLoginPage.goto();
      await demoLoginPage.loginAndExpectDashboard(
        demoUser.email,
        demoUser.password
      );

      // Navigate directly to the project settings page
      const demoSettingsPage = new ProjectSettingsPage(demoPage);
      await demoPage.goto(`/projects/${projectId}/settings`);
      await demoSettingsPage.gotoMembersTab();

      await expect(demoPage.getByText("Team Members")).toBeVisible({
        timeout: 10_000,
      });

      // Verify Admin User is visible in the list
      await expect(demoPage.getByText(adminUser.email)).toBeVisible({
        timeout: 10_000,
      });

      // Admin can open the member's dropdown, but should NOT see "Transfer ownership"
      await demoSettingsPage.expectTransferOwnershipMenuItemNotVisible(
        adminUser.name
      );

      await demoContext.close();

      // Cleanup
      await deleteProject(authenticatedPage, projectId);
    });

    test("member does not see transfer ownership button", async ({
      authenticatedPage,
      browser,
    }) => {
      const { projectSettingsPage } = await openProjectSettingsByKey(
        authenticatedPage,
        "MKT"
      );
      await projectSettingsPage.gotoMembersTab();

      await expect(authenticatedPage.getByText("Team Members")).toBeVisible({
        timeout: 10_000,
      });

      await projectSettingsPage.removeMemberIfPresent(
        demoUser.email,
        demoUser.name
      );
      await projectSettingsPage.removeMemberIfPresent(
        adminUser.email,
        adminUser.name
      );

      await projectSettingsPage.inviteMemberByEmailFragment(
        "demo",
        demoUser.email,
        "member"
      );

      const demoContext = await browser.newContext();
      const demoPage = await demoContext.newPage();
      const demoLoginPage = new LoginPage(demoPage);
      await demoLoginPage.goto();
      await demoLoginPage.loginAndExpectDashboard(
        demoUser.email,
        demoUser.password
      );

      const demoProjectsPage = new ProjectsPage(demoPage);
      await demoProjectsPage.goto();
      await demoPage.getByText("MKT").first().click();

      const demoSettingsPage = new ProjectSettingsPage(demoPage);
      await demoSettingsPage.gotoMembersTab();

      await expect(demoPage.getByText("Team Members")).toBeVisible({
        timeout: 10_000,
      });

      // Members have no actions dropdown at all, so verify no actions button exists
      await demoSettingsPage.expectMemberActionsButtonNotVisible(testUser.name);

      await demoContext.close();
    });
  });

  test.describe("Dialog Behavior", () => {
    test("dropdown shows only non-owner members", async ({
      authenticatedPage,
    }) => {
      const { projectSettingsPage, projectId } = await createTestProject(
        authenticatedPage,
        { addDemoUserAs: "member" }
      );

      await projectSettingsPage.openTransferOwnershipDialogForMember(
        demoUser.name
      );
      await projectSettingsPage.expectMemberInTransferDropdown(demoUser.name);
      await projectSettingsPage.expectMemberNotInTransferDropdown(
        testUser.name
      );
      await projectSettingsPage.closeTransferOwnershipDialog();

      await deleteProject(authenticatedPage, projectId);
    });

    test("submit button disabled until checkbox checked", async ({
      authenticatedPage,
    }) => {
      const { projectSettingsPage, projectId } = await createTestProject(
        authenticatedPage,
        { addDemoUserAs: "member" }
      );

      await projectSettingsPage.openTransferOwnershipDialogForMember(
        demoUser.name
      );
      await projectSettingsPage.expectTransferSubmitButtonDisabled();
      await projectSettingsPage.selectNewOwner(demoUser.name);
      await projectSettingsPage.expectTransferSubmitButtonDisabled();
      await projectSettingsPage.checkTransferConfirmation();
      await projectSettingsPage.expectTransferSubmitButtonEnabled();
      await projectSettingsPage.closeTransferOwnershipDialog();

      await deleteProject(authenticatedPage, projectId);
    });

    test("cancel closes dialog without changes", async ({
      authenticatedPage,
    }) => {
      const { projectSettingsPage, projectId } = await createTestProject(
        authenticatedPage,
        { addDemoUserAs: "member" }
      );

      await projectSettingsPage.openTransferOwnershipDialogForMember(
        demoUser.name
      );
      await projectSettingsPage.selectNewOwner(demoUser.name);
      await projectSettingsPage.checkTransferConfirmation();
      await projectSettingsPage.closeTransferOwnershipDialog();

      // Verify roles are unchanged
      await projectSettingsPage.expectMemberRole(testUser.email, "Owner");
      await projectSettingsPage.expectMemberRole(demoUser.email, "Member");

      await deleteProject(authenticatedPage, projectId);
    });
  });

  test.describe("Transfer Flow", () => {
    test("complete ownership transfer flow", async ({
      authenticatedPage,
      browser,
    }) => {
      // Setup: create project with demoUser as member
      const { projectSettingsPage, projectId } = await createTestProject(
        authenticatedPage,
        { addDemoUserAs: "member" }
      );

      // Execute transfer
      await projectSettingsPage.openTransferOwnershipDialogForMember(
        demoUser.name
      );
      await projectSettingsPage.selectNewOwner(demoUser.name);
      await projectSettingsPage.checkTransferConfirmation();
      await projectSettingsPage.submitTransfer();
      await projectSettingsPage.expectTransferSuccess(demoUser.name);

      // Verify old owner (testUser) is now Member
      await authenticatedPage.reload();
      await projectSettingsPage.gotoMembersTab();
      await projectSettingsPage.expectMemberRole(testUser.email, "Member");

      // Verify old owner cannot see Transfer menu (members don't see actions)
      await projectSettingsPage.expectMemberActionsButtonNotVisible(
        demoUser.name
      );

      // Verify new owner (demoUser) perspective
      const { context: newOwnerContext, page: newOwnerPage } =
        await newLoggedInPage(browser, demoUser);
      const newOwnerSettingsPage = new ProjectSettingsPage(newOwnerPage);
      await newOwnerPage.goto(`/projects/${projectId}/settings`);
      await newOwnerSettingsPage.gotoMembersTab();
      await newOwnerSettingsPage.expectMemberRole(demoUser.email, "Owner");
      await newOwnerSettingsPage.expectTransferOwnershipMenuItemVisible(
        testUser.name
      );

      // Cleanup (new owner must delete)
      await deleteProject(newOwnerPage, projectId);
      await newOwnerContext.close();
    });
  });

  test.describe("Edge Cases", () => {
    test("owner-only project has no transferable members", async ({
      authenticatedPage,
    }) => {
      const { projectSettingsPage, projectId } =
        await createTestProject(authenticatedPage);
      await projectSettingsPage.gotoMembersTab();

      // Only owner exists - verify only 1 member row
      const memberCount = await authenticatedPage
        .locator('[class*="divide-y"] > div.group')
        .count();
      expect(memberCount).toBe(1);
      await projectSettingsPage.expectMemberRole(testUser.email, "Owner");

      await deleteProject(authenticatedPage, projectId);
    });
  });

  test.describe("API Validation", () => {
    test("rejects transfer to self with BAD_REQUEST", async ({
      authenticatedPage,
    }) => {
      const { projectId } = await createTestProject(authenticatedPage, {
        addDemoUserAs: "member",
      });
      const me = await callRpc(authenticatedPage, "/api/rpc/privateData");
      const currentUserId = (me.body as { json?: { user?: { id?: string } } })
        ?.json?.user?.id;

      if (!currentUserId) {
        throw new Error(
          `Could not resolve current user id: ${JSON.stringify(me.body)}`
        );
      }

      const result = await callRpc(
        authenticatedPage,
        "/api/rpc/projects/transferOwnership",
        {
          projectId,
          newOwnerId: currentUserId,
        }
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(400);
      expect(readOrpcMessage(result.body)).toMatch(TRANSFER_TO_SELF_REGEX);

      await deleteProject(authenticatedPage, projectId);
    });

    test("rejects transfer to non-member with NOT_FOUND", async ({
      authenticatedPage,
    }) => {
      const { projectId } = await createTestProject(authenticatedPage);

      const result = await callRpc(
        authenticatedPage,
        "/api/rpc/projects/transferOwnership",
        {
          projectId,
          newOwnerId: "nonexistent-user-id",
        }
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
      expect(readOrpcMessage(result.body)).toMatch(
        TRANSFER_TO_NON_MEMBER_REGEX
      );

      await deleteProject(authenticatedPage, projectId);
    });

    test("rejects non-owner caller with FORBIDDEN", async ({
      authenticatedPage,
      browser,
    }) => {
      const { projectId } = await createTestProject(authenticatedPage, {
        addDemoUserAs: "admin",
      });
      const { context: adminContext, page: adminPage } = await newLoggedInPage(
        browser,
        demoUser
      );

      const result = await callRpc(
        adminPage,
        "/api/rpc/projects/transferOwnership",
        {
          projectId,
          newOwnerId: "any-user-id",
        }
      );

      expect(result.ok).toBe(false);
      expect(result.status).toBe(403);
      expect(readOrpcMessage(result.body)).toMatch(PERMISSION_DENIED_REGEX);

      await adminContext.close();
      await deleteProject(authenticatedPage, projectId);
    });
  });
});

test.describe("Project Access", () => {
  test("non-member cannot access project settings", async ({ browser }) => {
    // First, get a projectId that test@example.com is NOT a member of.
    // Use demo user's seeded project to obtain a real, seeded project ID.
    const { context: demoContext, page: demoPage } = await newLoggedInPage(
      browser,
      demoUser
    );

    const demoProjectsPage = new ProjectsPage(demoPage);
    await demoProjectsPage.goto();
    await demoProjectsPage.expectToBeOnProjectsPage();
    await demoProjectsPage.clickProjectByKey("DEMO");

    const demoProjectSettingsPage = new ProjectSettingsPage(demoPage);
    await demoProjectSettingsPage.expectToBeOnSettingsPage();

    const demoProjectId = projectIdFromSettingsUrl(demoPage.url());
    await demoContext.close();

    // Now, try to access that project as the test user.
    // Use a separate context to avoid console error enforcement for expected 403s.
    const { context: testContext, page: testPage } = await newLoggedInPage(
      browser,
      testUser
    );

    await testPage.goto(`/projects/${demoProjectId}/settings`);
    await expectProjectSettingsAccessDenied(testPage);

    await testContext.close();
  });
  test("project card click navigates to settings", async ({
    authenticatedPage,
  }) => {
    const project = firstUserProjectOrThrow();
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      project.key
    );

    // Verify project key is displayed
    await projectSettingsPage.expectProjectKeyValue(project.key);
  });

  test("owner can edit project settings", async ({ authenticatedPage }) => {
    const project = firstUserProjectOrThrow();
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      project.key
    );

    // Owner should be able to edit - verify form fields are not disabled
    const nameInput = authenticatedPage.getByLabel("Project name");
    await expect(nameInput).toBeEnabled();

    // Edit name
    const timestamp = Date.now().toString().slice(-4);
    const newName = `Test Name ${timestamp}`;
    await projectSettingsPage.fillProjectName(newName);

    // Save and verify success
    await projectSettingsPage.saveAndExpectSuccess();
  });

  test("back link navigates to projects list", async ({
    authenticatedPage,
  }) => {
    const project = firstUserProjectOrThrow();
    const { projectsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      project.key
    );

    // Click back link
    await authenticatedPage
      .getByRole("link", { name: BACK_TO_PROJECTS_REGEX })
      .click();

    // Verify we're back on projects list
    await projectsPage.expectToBeOnProjectsPage();
  });

  test("member sees read-only settings", async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage);
    const projectSettingsPage = new ProjectSettingsPage(authenticatedPage);

    // Get a project where test user is a member (not owner)
    const memberProject = memberProjects[0];
    if (!memberProject) {
      throw new Error(
        "No member projects found for test user - ensure TEAM project is seeded with test@example.com as member"
      );
    }

    // Navigate directly to the member project settings
    await projectsPage.goto();
    await projectsPage.clickProject(memberProject.name);

    await projectSettingsPage.expectToBeOnSettingsPage();

    // Verify form fields are disabled (read-only)
    const nameInput = authenticatedPage.getByLabel("Project name");
    await expect(nameInput).toBeDisabled();

    const descriptionInput = authenticatedPage.getByLabel("Description");
    await expect(descriptionInput).toBeDisabled();

    // Verify the read-only info message is shown
    await expect(
      authenticatedPage.getByText(VIEW_ONLY_ACCESS_REGEX)
    ).toBeVisible();

    // Verify save button is NOT visible
    await expect(
      authenticatedPage.getByRole("button", { name: SAVE_BUTTON_REGEX })
    ).not.toBeVisible();
  });
});

async function callRpc(
  page: {
    request: {
      post: (
        url: string,
        options: { data: unknown }
      ) => Promise<{
        ok: () => boolean;
        status: () => number;
        json: () => Promise<unknown>;
      }>;
    };
  },
  path: string,
  input: Record<string, unknown> = {}
): Promise<{ ok: boolean; status: number; body: unknown }> {
  const res = await page.request.post(path, {
    data: { json: input, meta: [] },
  });

  return { ok: res.ok(), status: res.status(), body: await res.json() };
}

function readOrpcMessage(body: unknown): string {
  if (typeof body === "object" && body && "message" in body) {
    const msg = (body as { message?: unknown }).message;
    if (typeof msg === "string") {
      return msg;
    }
  }

  if (typeof body === "object" && body && "json" in body) {
    const json = (body as { json?: unknown }).json;
    if (typeof json === "object" && json && "message" in json) {
      const msg = (json as { message?: unknown }).message;
      if (typeof msg === "string") {
        return msg;
      }
    }
  }

  return JSON.stringify(body);
}

test.describe("Project Settings", () => {
  test("can edit project name and description", async ({
    authenticatedPage,
  }) => {
    const { project, projectSettingsPage } =
      await openFirstUserProjectSettings(authenticatedPage);

    // Verify the key is correct (this is immutable)
    await projectSettingsPage.expectProjectKeyValue(project.key);

    // Edit the name - add timestamp to ensure it's different from current
    const timestamp = Date.now().toString().slice(-4);
    const newName = `Test Name ${timestamp}`;
    await projectSettingsPage.fillProjectName(newName);

    // Verify unsaved changes indicator
    await projectSettingsPage.expectUnsavedIndicator();

    // Save changes
    await projectSettingsPage.saveAndExpectSuccess();
  });

  test("project key is read-only in settings", async ({
    authenticatedPage,
  }) => {
    const { project, projectSettingsPage } =
      await openFirstUserProjectSettings(authenticatedPage);

    // Verify the key field
    await projectSettingsPage.expectProjectKeyValue(project.key);
    await projectSettingsPage.expectProjectKeyReadOnly();
    await projectSettingsPage.expectProjectKeyDisabled();
  });

  test("save button is disabled when no changes", async ({
    authenticatedPage,
  }) => {
    const { projectSettingsPage } =
      await openFirstUserProjectSettings(authenticatedPage);

    // Save button should be disabled initially
    await projectSettingsPage.expectSaveButtonDisabled();

    // Make a change - just add some text to make it different
    const timestamp = Date.now().toString().slice(-4);
    await projectSettingsPage.fillProjectName(`Changed ${timestamp}`);

    // Save button should be enabled
    await projectSettingsPage.expectSaveButtonEnabled();
  });
});

test.describe("Project Members", () => {
  test.describe.configure({ mode: "serial" });

  test.afterEach(async ({ authenticatedPage }) => {
    try {
      const { projectSettingsPage } = await openProjectSettingsByKey(
        authenticatedPage,
        "MKT"
      );

      await projectSettingsPage.gotoMembersTab();
      await projectSettingsPage.removeMemberIfPresent(
        demoUser.email,
        demoUser.name
      );
    } catch {
      // Best-effort cleanup; don't hide original failures.
    }
  });
  test("owner/admin invite grants user access", async ({
    authenticatedPage,
    browser,
  }) => {
    const projectKey = "MKT";
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      projectKey
    );

    await projectSettingsPage.gotoMembersTab();
    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );

    // Search by fragment (common usage)
    await projectSettingsPage.inviteMemberByEmailFragment(
      "demo",
      demoUser.email
    );
    await projectSettingsPage.expectMemberRole(demoUser.email, "Member");

    // Verify invited user sees project in their projects list
    const demoContext = await browser.newContext();
    const demoPage = await demoContext.newPage();

    const demoLoginPage = new LoginPage(demoPage);
    await demoLoginPage.goto();
    await demoLoginPage.loginAndExpectDashboard(
      demoUser.email,
      demoUser.password
    );

    const demoProjectsPage = new ProjectsPage(demoPage);
    await demoProjectsPage.goto();
    await demoProjectsPage.expectToBeOnProjectsPage();

    await expect(
      demoPage.getByText(projectKey, { exact: true }).first()
    ).toBeVisible();

    await demoContext.close();
  });

  test("owner/admin remove revokes user access", async ({
    authenticatedPage,
    browser,
  }) => {
    const projectKey = "MKT";
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      projectKey
    );

    await projectSettingsPage.gotoMembersTab();

    // Ensure member exists (idempotent if test runs alone)
    if (!(await projectSettingsPage.isMemberListed(demoUser.email))) {
      await projectSettingsPage.inviteMemberByEmailFragment(
        "demo",
        demoUser.email
      );
    }

    // Precondition: invited user sees project
    const demoContextBeforeRemoval = await browser.newContext();
    const demoPageBeforeRemoval = await demoContextBeforeRemoval.newPage();

    const demoLoginPageBeforeRemoval = new LoginPage(demoPageBeforeRemoval);
    await demoLoginPageBeforeRemoval.goto();
    await demoLoginPageBeforeRemoval.loginAndExpectDashboard(
      demoUser.email,
      demoUser.password
    );

    const demoProjectsPageBeforeRemoval = new ProjectsPage(
      demoPageBeforeRemoval
    );
    await demoProjectsPageBeforeRemoval.goto();
    await demoProjectsPageBeforeRemoval.expectToBeOnProjectsPage();

    await expect(
      demoPageBeforeRemoval.getByText(projectKey, { exact: true }).first()
    ).toBeVisible();

    await demoContextBeforeRemoval.close();

    // Remove and verify user loses access
    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );

    const demoContextAfterRemoval = await browser.newContext();
    const demoPageAfterRemoval = await demoContextAfterRemoval.newPage();

    const demoLoginPageAfterRemoval = new LoginPage(demoPageAfterRemoval);
    await demoLoginPageAfterRemoval.goto();
    await demoLoginPageAfterRemoval.loginAndExpectDashboard(
      demoUser.email,
      demoUser.password
    );

    const demoProjectsPageAfterRemoval = new ProjectsPage(demoPageAfterRemoval);
    await demoProjectsPageAfterRemoval.goto();
    await demoProjectsPageAfterRemoval.expectToBeOnProjectsPage();

    await expect(
      demoPageAfterRemoval.getByText(projectKey, { exact: true }).first()
    ).not.toBeVisible();

    await demoContextAfterRemoval.close();
  });

  test("server rejects self-removal", async ({ authenticatedPage }) => {
    await openProjectSettingsByKey(authenticatedPage, "MKT");

    const settingsUrl = authenticatedPage.url();
    const match = settingsUrl.match(PROJECT_SETTINGS_URL_ID_REGEX);
    if (!match?.[1]) {
      throw new Error(`Could not parse projectId from URL: ${settingsUrl}`);
    }
    const projectId = match[1];

    const me = await callRpc(authenticatedPage, "/api/rpc/privateData");
    const currentUserId =
      typeof me.body === "object" &&
      me.body &&
      "json" in me.body &&
      typeof (me.body as any).json?.user?.id === "string"
        ? (me.body as any).json.user.id
        : null;

    if (!currentUserId) {
      throw new Error(
        `Could not resolve current user id: ${JSON.stringify(me.body)}`
      );
    }

    const removeSelf = await callRpc(
      authenticatedPage,
      "/api/rpc/projects/removeMember",
      {
        projectId,
        userId: currentUserId,
      }
    );

    expect(removeSelf.ok).toBe(false);
    expect(removeSelf.status).toBe(400);
    expect(readOrpcMessage(removeSelf.body)).toMatch(CANNOT_REMOVE_SELF_REGEX);
  });

  test("owner can promote member to admin", async ({ authenticatedPage }) => {
    const projectKey = "MKT";
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      projectKey
    );

    await projectSettingsPage.gotoMembersTab();
    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );
    await projectSettingsPage.inviteMemberByEmailFragment(
      "demo",
      demoUser.email
    );

    await projectSettingsPage.promoteMemberToAdmin(demoUser.name);
    await projectSettingsPage.expectMemberRole(demoUser.email, "Admin");

    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );
  });

  test("owner can invite by display name fragment", async ({
    authenticatedPage,
  }) => {
    const projectKey = "MKT";
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      projectKey
    );

    await projectSettingsPage.gotoMembersTab();
    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );

    // Search by display name (not only email)
    await projectSettingsPage.inviteMemberByEmailFragment(
      "Demo",
      demoUser.email
    );

    await projectSettingsPage.expectMemberRole(demoUser.email, "Member");

    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );
  });

  test("admin cannot remove self (UI)", async ({
    authenticatedPage,
    browser,
  }) => {
    const projectKey = "MKT";
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      projectKey
    );

    await projectSettingsPage.gotoMembersTab();
    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );

    // Add demo user as admin
    await projectSettingsPage.inviteMemberByEmailFragment(
      "demo",
      demoUser.email,
      "admin"
    );

    // Demo user should not see an action to remove themselves.
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    const adminLogin = new LoginPage(adminPage);
    await adminLogin.goto();
    await adminLogin.loginAndExpectDashboard(demoUser.email, demoUser.password);

    const { projectSettingsPage: demoProjectSettingsPage } =
      await openProjectSettingsByKey(adminPage, projectKey);

    await demoProjectSettingsPage.gotoMembersTab();
    await demoProjectSettingsPage.expectMemberRole(demoUser.email, "Admin");
    await demoProjectSettingsPage.expectMemberActionsButtonNotVisible(
      demoUser.name
    );

    await adminContext.close();

    // Cleanup
    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );
  });

  test("owner can demote admin to member", async ({ authenticatedPage }) => {
    const projectKey = "MKT";
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      projectKey
    );

    await projectSettingsPage.gotoMembersTab();
    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );
    await projectSettingsPage.inviteMemberByEmailFragment(
      "demo",
      demoUser.email
    );

    await projectSettingsPage.promoteMemberToAdmin(demoUser.name);
    await projectSettingsPage.expectMemberRole(demoUser.email, "Admin");

    await projectSettingsPage.demoteAdminToMember(demoUser.name);
    await projectSettingsPage.expectMemberRole(demoUser.email, "Member");
    await projectSettingsPage.expectMemberRoleNotVisible(
      demoUser.email,
      "Admin"
    );

    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );
  });

  test("owner sees inline error when inviting an existing member", async ({
    authenticatedPage,
  }) => {
    const projectKey = "MKT";
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      projectKey
    );

    await projectSettingsPage.gotoMembersTab();
    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );
    await projectSettingsPage.inviteMemberByEmailFragment(
      "demo",
      demoUser.email
    );

    await projectSettingsPage.inviteExistingMemberExpectingError(
      "demo",
      demoUser.email,
      USER_ALREADY_MEMBER_REGEX
    );
    await projectSettingsPage.closeInviteDialog();

    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );
  });

  test("owner invite rejects unknown user (server)", async ({
    authenticatedPage,
  }) => {
    const projectKey = "MKT";
    await openProjectSettingsByKey(authenticatedPage, projectKey);

    const settingsUrl = authenticatedPage.url();
    const match = settingsUrl.match(PROJECT_SETTINGS_URL_ID_REGEX);
    if (!match?.[1]) {
      throw new Error(`Could not parse projectId from URL: ${settingsUrl}`);
    }
    const projectId = match[1];

    const invite = await callRpc(
      authenticatedPage,
      "/api/rpc/projects/inviteMember",
      {
        projectId,
        userId: "user-does-not-exist",
        role: "member",
      }
    );

    expect(invite.ok).toBe(false);
    expect(invite.status).toBe(400);
    expect(readOrpcMessage(invite.body)).toMatch(USER_NOT_FOUND_REGEX);
  });

  test("admin cannot remove owner (UI + server)", async ({
    authenticatedPage,
    browser,
  }) => {
    const projectKey = "MKT";
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      projectKey
    );

    await projectSettingsPage.gotoMembersTab();
    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );

    // Invite demo user as admin
    await projectSettingsPage.inviteMemberByEmailFragment(
      "demo",
      demoUser.email,
      "admin"
    );

    const ownerSettingsUrl = authenticatedPage.url();
    const match = ownerSettingsUrl.match(PROJECT_SETTINGS_URL_ID_REGEX);
    if (!match?.[1]) {
      throw new Error(
        `Could not parse projectId from URL: ${ownerSettingsUrl}`
      );
    }
    const projectId = match[1];

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    const loginPage = new LoginPage(adminPage);
    await loginPage.goto();
    await loginPage.loginAndExpectDashboard(demoUser.email, demoUser.password);

    // UI: owner cannot be removed (no action shown)
    const { projectSettingsPage: adminProjectSettingsPage } =
      await openProjectSettingsByKey(adminPage, projectKey);
    await adminProjectSettingsPage.gotoMembersTab();
    await adminProjectSettingsPage.expectMemberActionsButtonNotVisible(
      testUser.name
    );

    // Server: cannot remove owner
    const members = await callRpc(adminPage, "/api/rpc/projects/listMembers", {
      projectId,
    });

    if (!members.ok) {
      throw new Error(
        `Could not list members: ${JSON.stringify(members.body)}`
      );
    }

    const ownerId =
      typeof members.body === "object" &&
      members.body &&
      "json" in members.body &&
      Array.isArray((members.body as any).json)
        ? ((members.body as any).json as any[]).find((m) => m.role === "owner")
            ?.user?.id
        : null;

    if (typeof ownerId !== "string") {
      throw new Error(
        `Could not resolve ownerId: ${JSON.stringify(members.body)}`
      );
    }

    const removeOwner = await callRpc(
      adminPage,
      "/api/rpc/projects/removeMember",
      {
        projectId,
        userId: ownerId,
      }
    );

    expect(removeOwner.ok).toBe(false);
    expect(removeOwner.status).toBe(400);
    expect(readOrpcMessage(removeOwner.body)).toMatch(
      CANNOT_REMOVE_OWNER_REGEX
    );

    await adminContext.close();

    await projectSettingsPage.removeMemberIfPresent(
      demoUser.email,
      demoUser.name
    );
  });

  test("member cannot change role (server FORBIDDEN)", async ({
    authenticatedPage,
  }) => {
    await openProjectSettingsByKey(authenticatedPage, "TEAM");

    const settingsUrl = authenticatedPage.url();
    const match = settingsUrl.match(PROJECT_SETTINGS_URL_ID_REGEX);
    if (!match?.[1]) {
      throw new Error(`Could not parse projectId from URL: ${settingsUrl}`);
    }
    const projectId = match[1];

    const changeRole = await callRpc(
      authenticatedPage,
      "/api/rpc/projects/changeMemberRole",
      {
        projectId,
        userId: "fake-user-id",
        role: "admin",
      }
    );

    expect(changeRole.ok).toBe(false);
    expect(changeRole.status).toBe(403);
    expect(readOrpcMessage(changeRole.body)).toMatch(PERMISSION_DENIED_REGEX);
  });

  test("member cannot invite/remove (server FORBIDDEN)", async ({
    authenticatedPage,
  }) => {
    const { projectSettingsPage } = await openProjectSettingsByKey(
      authenticatedPage,
      "TEAM"
    );

    await projectSettingsPage.gotoMembersTab();
    await projectSettingsPage.expectInviteMemberButtonNotVisible();

    const settingsUrl = authenticatedPage.url();
    const match = settingsUrl.match(PROJECT_SETTINGS_URL_ID_REGEX);
    if (!match?.[1]) {
      throw new Error(`Could not parse projectId from URL: ${settingsUrl}`);
    }
    const projectId = match[1];

    const invite = await callRpc(
      authenticatedPage,
      "/api/rpc/projects/inviteMember",
      {
        projectId,
        userId: "fake-user-id",
        role: "member",
      }
    );

    expect(invite.ok).toBe(false);
    expect(invite.status).toBe(403);
    expect(readOrpcMessage(invite.body)).toMatch(PERMISSION_DENIED_REGEX);

    const remove = await callRpc(
      authenticatedPage,
      "/api/rpc/projects/removeMember",
      {
        projectId,
        userId: "fake-user-id",
      }
    );

    expect(remove.ok).toBe(false);
    expect(remove.status).toBe(403);
    expect(readOrpcMessage(remove.body)).toMatch(PERMISSION_DENIED_REGEX);
  });
});
