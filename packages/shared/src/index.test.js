import assert from "node:assert/strict";
import { test } from "node:test";
import { isSandboxResponse } from "./index.js";

test("only an explicit X-Mock: true marks a sandbox response", () => {
	assert.equal(isSandboxResponse(new Headers({ "x-mock": "true" })), true);
	for (const value of ["false", "TRUE", "1", ""]) {
		assert.equal(isSandboxResponse(new Headers({ "X-Mock": value })), false);
	}
	assert.equal(isSandboxResponse(new Headers()), false);
});
