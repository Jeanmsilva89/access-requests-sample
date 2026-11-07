import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	webServer: [
		{
			command: "pnpm start:mocks",
			url: "http://127.0.0.1:4010/health",
			reuseExistingServer: !process.env.CI,
		},
		{
			command: "pnpm dev",
			url: "http://127.0.0.1:5173",
			reuseExistingServer: !process.env.CI,
		},
	],
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	reporter: [
		["list"],
		["html", { open: "never", outputFolder: "playwright-report" }],
	],
	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "on",
		video: "on",
		viewport: { width: 1280, height: 720 },
		launchOptions: {
			slowMo: 500,
		},
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 720 },
			},
		},
	],
});
