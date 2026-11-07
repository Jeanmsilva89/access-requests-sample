import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { checkBoundaries } from "./check-boundaries.mjs";

test("rejects relative, package, dynamic, alias, and shared backreferences", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "app-boundaries-"));
	try {
		for (const app of ["one", "two"]) {
			fs.mkdirSync(path.join(root, "apps", app), { recursive: true });
			fs.writeFileSync(
				path.join(root, "apps", app, "package.json"),
				JSON.stringify({ name: `@apps/${app}` }),
			);
		}
		fs.mkdirSync(path.join(root, "packages/shared"), { recursive: true });
		const source = path.join(root, "apps/one/index.js");
		for (const code of [
			'import "../two/index.js";',
			'export * from "@apps/two";',
			'const x = import("../two/index.js");',
			'const x = require("../two/index.js");',
			'const alias = "apps/two/index.js";',
		]) {
			fs.writeFileSync(source, code);
			assert.equal(checkBoundaries(root).length, 1, code);
		}
		fs.writeFileSync(source, 'import "@repo/shared";');
		assert.deepEqual(checkBoundaries(root), []);
		fs.writeFileSync(
			path.join(root, "packages/shared/index.js"),
			'export * from "../../apps/two/index.js";',
		);
		assert.equal(checkBoundaries(root).length, 1);
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});
