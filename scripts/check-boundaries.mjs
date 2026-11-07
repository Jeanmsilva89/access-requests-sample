import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ignored = new Set([
	"node_modules",
	".git",
	"dist",
	"test-results",
	"playwright-report",
	"evidence",
]);
function files(dir) {
	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		if (ignored.has(entry.name)) return [];
		const target = path.join(dir, entry.name);
		if (entry.isSymbolicLink())
			throw new Error(`Symlinks are not allowed in app source: ${target}`);
		return entry.isDirectory() ? files(target) : [target];
	});
}
export function checkBoundaries(root) {
	const appsDir = path.join(root, "apps");
	const apps = fs
		.readdirSync(appsDir)
		.filter((name) => fs.statSync(path.join(appsDir, name)).isDirectory());
	const names = new Map(
		apps.map((app) => [
			JSON.parse(fs.readFileSync(path.join(appsDir, app, "package.json"))).name,
			app,
		]),
	);
	const violations = [];
	for (const app of apps) {
		for (const file of files(path.join(appsDir, app))) {
			if (!/\.(?:[cm]?[jt]sx?|json)$/.test(file)) continue;
			const text = fs.readFileSync(file, "utf8");
			// Inspect all string literals: imports, require(), dynamic imports,
			// package dependencies, tsconfig paths, and bundler aliases alike.
			for (const match of text.matchAll(/["'`]([^"'`\r\n]+)["'`]/g)) {
				const specifier = match[1].replace(/^file:|^link:/, "");
				const target = path.resolve(path.dirname(file), specifier);
				const relative = path.relative(appsDir, target).split(path.sep);
				const owner = [...names].find(
					([name]) => specifier === name || specifier.startsWith(`${name}/`),
				)?.[1];
				const repoTarget = specifier
					.replace(/^\/?(?:@\/)?apps\//, "")
					.split("/")[0];
				const foreignRelative =
					!relative[0].startsWith(".") &&
					apps.includes(relative[0]) &&
					relative[0] !== app;
				if (
					foreignRelative ||
					(owner && owner !== app) ||
					(specifier.includes("apps/") &&
						apps.includes(repoTarget) &&
						repoTarget !== app)
				) {
					violations.push(
						`${path.relative(root, file)}: cross-app reference ${match[1]}`,
					);
				}
			}
		}
	}
	// Shared packages cannot depend back on an app (no indirect cross-app imports).
	for (const file of files(path.join(root, "packages"))) {
		if (!/\.(?:[cm]?[jt]sx?|json)$/.test(file)) continue;
		const text = fs.readFileSync(file, "utf8");
		if (
			/apps\//.test(text) ||
			[...names.keys()].some((name) => text.includes(name))
		) {
			violations.push(
				`${path.relative(root, file)}: shared code must not reference apps`,
			);
		}
	}
	return violations;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const violations = checkBoundaries(process.cwd());
	if (violations.length) {
		console.error(violations.join("\n"));
		process.exitCode = 1;
	} else console.log("App boundaries OK");
}
