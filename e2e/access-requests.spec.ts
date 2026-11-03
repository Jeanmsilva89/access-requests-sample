import { expect, test, type Page } from "@playwright/test";

const API = process.env.VITE_API_BASE_URL || "http://localhost:4010";

async function resetMocks() {
  const res = await fetch(`${API}/__reset`, { method: "POST" });
  if (!res.ok) throw new Error(`reset failed: ${res.status}`);
}

async function expectBanner(page: Page) {
  const banner = page.getByTestId("sandbox-banner");
  await expect(banner).toBeVisible({ timeout: 15000 });
  await expect(banner).toHaveText("Running against mocks (sandbox)");
}

test.describe("Access Requests app shell", () => {
  test.beforeEach(async () => {
    await resetMocks();
  });

  test("navigates all four routes with sandbox banner on each", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("/");
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expectBanner(page);
    await expect(page.getByTestId("stat-total")).toContainText("5");
    await expect(page.getByTestId("stat-pending")).toContainText("2");
    await expect(page.getByTestId("stat-approved")).toContainText("2");
    await expect(page.getByTestId("stat-denied")).toContainText("1");

    await page.getByTestId("nav-requests").click();
    await expect(page).toHaveURL(/\/requests$/);
    await expect(page.getByTestId("requests-page")).toBeVisible();
    await expectBanner(page);

    await page.getByTestId("nav-new-request").click();
    await expect(page).toHaveURL(/\/requests\/new$/);
    await expect(page.getByTestId("new-request-page")).toBeVisible();
    await expectBanner(page);

    await page.getByTestId("nav-audit").click();
    await expect(page).toHaveURL(/\/audit$/);
    await expect(page.getByTestId("audit-page")).toBeVisible();
    await expectBanner(page);
    await expect(page.getByTestId("audit-list")).toBeVisible();
    await expect(page.locator('[data-testid^="audit-event-"]')).toHaveCount(8);

    await page.getByTestId("nav-dashboard").click();
    await expect(page).toHaveURL(/\/$/);
    await expectBanner(page);
  });

  test("create via form with validation error then success", async ({ page }) => {
    test.setTimeout(90000);
    await page.goto("/requests/new");
    await expect(page.getByTestId("new-request-page")).toBeVisible();
    await expectBanner(page);

    // Validation error: submit empty/incomplete form
    await page.getByTestId("requester-input").fill("");
    await page.getByTestId("resource-input").fill("");
    await page.getByTestId("justification-input").fill("short");
    await page.getByTestId("submit-btn").click();

    await expect(page.getByText("Requester is required")).toBeVisible();
    await expect(page.getByText("Resource is required")).toBeVisible();
    await expect(page.getByText("Access level is required")).toBeVisible();
    await expect(page.getByText("Justification must be at least 10 characters")).toBeVisible();

    // Successful create
    const uniqueResource = `vault-e2e-${Date.now()}`;
    await page.getByTestId("requester-input").fill("e2e@example.com");
    await page.getByTestId("resource-input").fill(uniqueResource);
    await page.getByTestId("access-level-select").click();
    await page.getByRole("option", { name: "Read" }).click();
    await page
      .getByTestId("justification-input")
      .fill("Need temporary read access for the e2e verification suite.");
    await page.getByTestId("submit-btn").click();

    await expect(page).toHaveURL(/\/requests$/);
    await expect(page.getByTestId("requests-page")).toBeVisible();
    await expect(page.getByRole("cell", { name: uniqueResource, exact: true })).toBeVisible();
    await expect(page.getByText("Request created")).toBeVisible();
  });

  test("filter approve and deny on Requests updates dashboard and audit", async ({ page }) => {
    test.setTimeout(120000);
    await page.goto("/requests");
    await expect(page.getByTestId("requests-page")).toBeVisible();
    await expectBanner(page);
    await expect(page.getByTestId("request-req-1")).toBeVisible();

    // Filter to pending via Mantine Select
    await page.getByTestId("status-filter").click();
    await page.getByRole("option", { name: "Pending", exact: true }).click();
    await expect(page.getByTestId("request-req-1")).toBeVisible();
    await expect(page.getByTestId("request-req-4")).toBeVisible();
    await expect(page.getByTestId("request-req-2")).toHaveCount(0);

    // Search narrows further
    await page.getByTestId("search-input").fill("analytics");
    await expect(page.getByTestId("request-req-1")).toBeVisible();
    await expect(page.getByTestId("request-req-4")).toHaveCount(0);

    // Approve req-1 (still visible under pending+search until status changes)
    await page.getByTestId("approve-req-1").click();
    // Pending filter drops the row once approved — clear filters to assert new status
    await page.getByTestId("search-input").fill("");
    await page.getByTestId("status-filter").click();
    await page.getByRole("option", { name: "All", exact: true }).click();
    await expect(page.getByTestId("request-req-1")).toBeVisible();
    await expect(page.getByTestId("status-req-1")).toContainText(/approved/i);
    await expect(page.getByTestId("approve-req-1")).toHaveCount(0);

    // Deny req-4
    await expect(page.getByTestId("request-req-4")).toBeVisible();
    await page.getByTestId("deny-req-4").click();
    await expect(page.getByTestId("status-req-4")).toContainText(/denied/i);
    await expect(page.getByTestId("deny-req-4")).toHaveCount(0);

    // Dashboard counts update
    await page.getByTestId("nav-dashboard").click();
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(page.getByTestId("stat-pending")).toContainText("0");
    await expect(page.getByTestId("stat-approved")).toContainText("3");
    await expect(page.getByTestId("stat-denied")).toContainText("2");

    // Audit log shows new events
    await page.getByTestId("nav-audit").click();
    await expect(page.getByTestId("audit-page")).toBeVisible();
    await expect(page.getByText(/Request approved: Access to analytics dashboard/i)).toBeVisible();
    await expect(page.getByText(/Request denied: Write access to customer CRM/i)).toBeVisible();
  });

  test("requests table shows seeded rows with banner", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/requests");
    await expectBanner(page);
    await expect(page.getByTestId("requests-page")).toBeVisible();
    const rows = page.locator('[data-testid^="request-req-"]');
    await expect(rows).toHaveCount(5);
  });
});
