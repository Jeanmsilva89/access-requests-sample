import { expect, test } from "@playwright/test";

const API = process.env.VITE_API_BASE_URL || "http://localhost:4010";

async function resetMocks() {
	const res = await fetch(`${API}/__reset`, { method: "POST" });
	if (!res.ok) throw new Error(`reset failed: ${res.status}`);
}

test.describe("Access Requests sandbox", () => {
	test.beforeEach(async () => {
		await resetMocks();
	});

	test("shows sandbox banner and create flow adds a request", async ({
		page,
	}) => {
		await page.goto("/");

		const banner = page.getByTestId("sandbox-banner");
		await expect(banner).toBeVisible();
		await expect(banner).toHaveText("Running against mocks (sandbox)");

		await expect(page.getByTestId("requests-list")).toBeVisible();
		const beforeCount = await page
			.locator('[data-testid="requests-list"] > li')
			.count();
		expect(beforeCount).toBeGreaterThanOrEqual(1);

		const uniqueTitle = `E2E access for vault-${Date.now()}`;
		await page.getByTestId("title-input").fill(uniqueTitle);
		await page.getByTestId("requester-input").fill("e2e@example.com");
		await page.getByTestId("submit-btn").click();

		await expect(page.getByText(uniqueTitle)).toBeVisible();
		const afterCount = await page
			.locator('[data-testid="requests-list"] > li')
			.count();
		expect(afterCount).toBe(beforeCount + 1);
	});

	test("approve pending request updates badge and hides buttons", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page.getByTestId("sandbox-banner")).toBeVisible();

		const row = page.getByTestId("request-req-1");
		await expect(row).toBeVisible();
		await expect(page.getByTestId("status-req-1")).toHaveText(/pending/i);
		await expect(page.getByTestId("approve-req-1")).toBeVisible();
		await expect(page.getByTestId("deny-req-1")).toBeVisible();

		await page.getByTestId("approve-req-1").click();

		await expect(page.getByTestId("status-req-1")).toHaveText(/approved/i);
		await expect(page.getByTestId("approve-req-1")).toHaveCount(0);
		await expect(page.getByTestId("deny-req-1")).toHaveCount(0);

		await page.screenshot({
			path: "test-results/evidence/after-approve.png",
			fullPage: true,
		});
	});

	test("deny pending request updates badge and hides buttons", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page.getByTestId("sandbox-banner")).toBeVisible();

		// Create a dedicated pending request so deny doesn't collide with approve test state
		const uniqueTitle = `E2E deny target-${Date.now()}`;
		await page.getByTestId("title-input").fill(uniqueTitle);
		await page.getByTestId("requester-input").fill("deny-e2e@example.com");
		await page.getByTestId("submit-btn").click();
		await expect(page.getByText(uniqueTitle)).toBeVisible();

		const card = page.locator('[data-testid="requests-list"] > li').filter({
			hasText: uniqueTitle,
		});
		await expect(card.locator(".status")).toHaveText(/pending/i);
		const denyBtn = card.getByRole("button", { name: "Deny" });
		await expect(denyBtn).toBeVisible();
		await denyBtn.click();

		await expect(card.locator(".status")).toHaveText(/denied/i);
		await expect(card.getByRole("button", { name: "Approve" })).toHaveCount(0);
		await expect(card.getByRole("button", { name: "Deny" })).toHaveCount(0);

		await page.screenshot({
			path: "test-results/evidence/after-deny.png",
			fullPage: true,
		});
	});
});
