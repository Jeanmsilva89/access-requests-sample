import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

export function selectApps(all, changed) {
	const common =
		changed === null ||
		changed.some((file) =>
			/^(packages\/|scripts\/|\.github\/|\.dockerignore$|\.npmrc$|package\.json$|pnpm-|biome\.json$)/.test(
				file,
			),
		);
	return all.filter(
		(app) => common || changed.some((file) => file.startsWith(`apps/${app}/`)),
	);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const base = process.env.BASE_SHA;
	const head = process.env.HEAD_SHA;
	const all = fs
		.readdirSync("apps")
		.filter((app) => fs.existsSync(`apps/${app}/package.json`));
	const changed =
		!base || /^0+$/.test(base)
			? null
			: execFileSync("git", ["diff", "--name-only", base, head || "HEAD"], {
					encoding: "utf8",
				})
					.trim()
					.split("\n");
	const apps = selectApps(all, changed);
	const output = `apps=${JSON.stringify(apps)}\nhas_apps=${apps.length > 0}\n`;
	if (process.env.GITHUB_OUTPUT)
		fs.appendFileSync(process.env.GITHUB_OUTPUT, output);
	else process.stdout.write(output);
}
