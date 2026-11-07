import assert from "node:assert/strict";
import { test } from "node:test";
import { selectApps } from "./changed-apps.mjs";

test("app changes select only their owner; common changes select all; docs select none", () => {
	const apps = ["access-requests", "reports"];
	assert.deepEqual(selectApps(apps, ["apps/reports/web/src/index.ts"]), [
		"reports",
	]);
	assert.deepEqual(selectApps(apps, ["apps/access-requests/.env.sandbox"]), [
		"access-requests",
	]);
	for (const file of [
		"packages/shared/src/index.js",
		"pnpm-lock.yaml",
		".dockerignore",
		"scripts/changed-apps.mjs",
		".github/workflows/ci.yml",
	]) {
		assert.deepEqual(selectApps(apps, [file]), apps);
	}
	assert.deepEqual(
		selectApps(apps, ["docs/new-app-checklist.md", "README.md"]),
		[],
	);
	assert.deepEqual(selectApps(apps, null), apps);
});
