import { TEST_PROJECTS } from "@planner/migrate/seed/projects";
import { demoUser, testUser } from "../../src/fixtures/auth.fixture";
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

test.describe("Projects List", () => {
  test("displays seeded projects for logged in user", async ({
    authenticatedPage,
  }) => {
    const projectsPage = new ProjectsPage(authenticatedPage);
    await projectsPage.goto();

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
    const projectsPage = new ProjectsPage(authenticatedPage);
    await projectsPage.goto();

    await expect(projectsPage.createProjectButton).toBeVisible();
  });
});

test.describe("Project Creation", () => {
  test("can create a new project with auto-generated key", async ({
    authenticatedPage,
  }) => {
    const projectsPage = new ProjectsPage(authenticatedPage);
    await projectsPage.goto();

    // Open create dialog
    await projectsPage.openCreateDialog();

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
    const projectsPage = new ProjectsPage(authenticatedPage);
    await projectsPage.goto();

    // Open create dialog
    await projectsPage.openCreateDialog();

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
    const projectsPage = new ProjectsPage(authenticatedPage);
    await projectsPage.goto();

    // Open create dialog
    await projectsPage.openCreateDialog();

    // Try to use an existing key (MKT from seed data)
    const existingKey = userProjects[0]?.key ?? "MKT";
    await projectsPage.fillProjectForm("Duplicate Key Test", existingKey);

    // Wait for key validation to complete
    await projectsPage.waitForKeyValidation();

    // Verify error is shown
    await projectsPage.expectKeyTakenError();
  });

  test("shows error for invalid key format", async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage);
    await projectsPage.goto();

    // Open create dialog
    await projectsPage.openCreateDialog();

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

test.describe("Project Access", () => {
  test("non-member cannot access project settings", async ({ browser }) => {
    // First, get a projectId that test@example.com is NOT a member of.
    // Use demo user's seeded project to obtain a real, seeded project ID.
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
    await demoProjectsPage.clickProjectByKey("DEMO");

    const demoProjectSettingsPage = new ProjectSettingsPage(demoPage);
    await demoProjectSettingsPage.expectToBeOnSettingsPage();

    const demoProjectUrl = demoPage.url();
    const match = demoProjectUrl.match(PROJECT_SETTINGS_URL_ID_REGEX);
    if (!match?.[1]) {
      throw new Error(`Could not parse projectId from URL: ${demoProjectUrl}`);
    }
    const demoProjectId = match[1];

    await demoContext.close();

    // Now, try to access that project as the test user.
    // Use a separate context to avoid console error enforcement for expected 403s.
    const testContext = await browser.newContext();
    const testPage = await testContext.newPage();

    const testLoginPage = new LoginPage(testPage);
    await testLoginPage.goto();
    await testLoginPage.loginAndExpectDashboard(
      testUser.email,
      testUser.password
    );

    await testPage.goto(`/projects/${demoProjectId}/settings`);

    // Wait for the settings error UI to render (dev server may compile on first hit).
    await expect(
      testPage.getByRole("heading", { name: ERROR_LOADING_SETTINGS_REGEX })
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      testPage.getByText(
        "You don't have access to this project. Contact project owner.",
        { exact: true }
      )
    ).toBeVisible();

    // Ensure the user has a way out.
    await expect(
      testPage.getByRole("button", { name: BACK_TO_PROJECTS_REGEX })
    ).toBeVisible();

    await testContext.close();
  });
  test("project card click navigates to settings", async ({
    authenticatedPage,
  }) => {
    const projectsPage = new ProjectsPage(authenticatedPage);
    const projectSettingsPage = new ProjectSettingsPage(authenticatedPage);

    // Navigate to projects list
    await projectsPage.goto();

    // Click on the first seeded project by key (name may have changed in previous runs)
    const project = userProjects[0];
    if (!project) {
      throw new Error("No seeded projects found for test user");
    }

    await projectsPage.clickProjectByKey(project.key);

    // Verify we're on the settings page
    await projectSettingsPage.expectToBeOnSettingsPage();

    // Verify project key is displayed
    await projectSettingsPage.expectProjectKeyValue(project.key);
  });

  test("owner can edit project settings", async ({ authenticatedPage }) => {
    const projectsPage = new ProjectsPage(authenticatedPage);
    const projectSettingsPage = new ProjectSettingsPage(authenticatedPage);

    await projectsPage.goto();

    const project = userProjects[0];
    if (!project) {
      throw new Error("No seeded projects found for test user");
    }

    await projectsPage.clickProjectByKey(project.key);
    await projectSettingsPage.expectToBeOnSettingsPage();

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
    const projectsPage = new ProjectsPage(authenticatedPage);
    const projectSettingsPage = new ProjectSettingsPage(authenticatedPage);

    await projectsPage.goto();

    const project = userProjects[0];
    if (!project) {
      throw new Error("No seeded projects found for test user");
    }

    await projectsPage.clickProjectByKey(project.key);
    await projectSettingsPage.expectToBeOnSettingsPage();

    // Click back link
    await authenticatedPage
      .getByRole("link", { name: BACK_TO_PROJECTS_REGEX })
      .click();

    // Verify we're back on projects list
    await projectsPage.expectToBeOnProjectsPage();
  });

  test("member sees read-only settings", async ({ authenticatedPage }) => {
    const projectSettingsPage = new ProjectSettingsPage(authenticatedPage);

    // Get a project where test user is a member (not owner)
    const memberProject = memberProjects[0];
    if (!memberProject) {
      throw new Error(
        "No member projects found for test user - ensure TEAM project is seeded with test@example.com as member"
      );
    }

    // Navigate directly to the member project settings
    await authenticatedPage.goto("/projects");

    // Find and click the TEAM project card (card has role="button" when clickable)
    await authenticatedPage
      .getByRole("button", {
        name: new RegExp(`Open project ${memberProject.name}`, "i"),
      })
      .click();

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

test.describe("Project Settings", () => {
  test("can edit project name and description", async ({
    authenticatedPage,
  }) => {
    const projectsPage = new ProjectsPage(authenticatedPage);
    const projectSettingsPage = new ProjectSettingsPage(authenticatedPage);

    // Navigate to a project (goes directly to settings now)
    await projectsPage.goto();
    const project = userProjects[0];
    if (!project) {
      throw new Error("No seeded projects found for test user");
    }

    await projectsPage.clickProjectByKey(project.key);
    await projectSettingsPage.expectToBeOnSettingsPage();

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
    const projectsPage = new ProjectsPage(authenticatedPage);
    const projectSettingsPage = new ProjectSettingsPage(authenticatedPage);

    // Navigate to a project settings
    await projectsPage.goto();
    const project = userProjects[0];
    if (!project) {
      throw new Error("No seeded projects found for test user");
    }

    await projectsPage.clickProjectByKey(project.key);
    await projectSettingsPage.expectToBeOnSettingsPage();

    // Verify the key field
    await projectSettingsPage.expectProjectKeyValue(project.key);
    await projectSettingsPage.expectProjectKeyReadOnly();
    await projectSettingsPage.expectProjectKeyDisabled();
  });

  test("save button is disabled when no changes", async ({
    authenticatedPage,
  }) => {
    const projectsPage = new ProjectsPage(authenticatedPage);
    const projectSettingsPage = new ProjectSettingsPage(authenticatedPage);

    // Navigate to project settings
    await projectsPage.goto();
    const project = userProjects[0];
    if (!project) {
      throw new Error("No seeded projects found for test user");
    }

    await projectsPage.clickProjectByKey(project.key);
    await projectSettingsPage.expectToBeOnSettingsPage();

    // Save button should be disabled initially
    await projectSettingsPage.expectSaveButtonDisabled();

    // Make a change - just add some text to make it different
    const timestamp = Date.now().toString().slice(-4);
    await projectSettingsPage.fillProjectName(`Changed ${timestamp}`);

    // Save button should be enabled
    await projectSettingsPage.expectSaveButtonEnabled();
  });
});
