# Independent apps workspace

A pnpm 9.15.9 workspace, not a shared application runtime. Each app owns its
frontend, API/client, sandbox, tests, deployment image, and (when introduced)
database. No cross-app imports. Access Requests owns the main domain; future
apps own subdomains and deploy without routing through the main-domain app.

```text
.
├── apps/
│   └── access-requests/
│       ├── package.json
│       ├── .env.sandbox
│       ├── web/                  # Mantine + React four-route frontend
│       ├── client/               # domain-specific fetch client
│       ├── mocks/                # Fastify sandbox, external to frontend
│       ├── e2e/
│       ├── docs/evidence/
│       ├── playwright.config.ts
│       ├── Dockerfile            # web and explicit sandbox targets
│       ├── nginx.conf
│       └── README.md
├── packages/shared/              # tiny, pure X-Mock protocol helpers only
├── scripts/                      # generic ownership and changed-app checks
├── docs/                         # repository decisions and onboarding
├── .github/workflows/ci.yml
├── package.json
├── pnpm-workspace.yaml
└── pnpm-lock.yaml
```

## Run an app

Node 22 and pnpm 9.15.9:

```sh
pnpm install --frozen-lockfile
pnpm --dir apps/access-requests dev:mocks   # terminal 1, :4010
pnpm --dir apps/access-requests dev         # terminal 2, :5173
pnpm --dir apps/access-requests build
pnpm --dir apps/access-requests exec playwright install chromium
pnpm --dir apps/access-requests test:e2e    # starts servers if absent locally
pnpm lint
```

See the [app README](apps/access-requests/README.md) for images and env settings.
The root scripts only orchestrate workspaces; app-specific commands live in the app.
The workspace lock pins dependencies, but an image copies no sibling apps. Shared
code is compiled/copied into images, never a runtime service or common auth module.

## Architecture and adding apps

- [Architecture overview](docs/architecture.md)
- [ADR-002: Self-contained apps](docs/adr/ADR-002-self-contained-apps.md)
- [New-app checklist](docs/new-app-checklist.md)
- [Authentication and authorization guide](docs/auth-and-authz.md)
- [Historical ADR-001](docs/adr-001-architecture.md)

CI discovers affected apps using their paths. Root workspace/tooling/shared changes
recheck all apps; docs-only changes skip app work but still report the `build` and
`e2e` gates. Each affected app gets its own lint/build/container and Playwright jobs.
A failing app does not cancel sibling jobs (`fail-fast: false`). Unaffected apps
are not built/tested/deployed. A PR changing multiple apps must pass all its affected
app checks. This is merge protection, not shared deployment orchestration.

`main` protection is unchanged: `build` and `e2e`, up-to-date branches, administrators
included. No automatic deploys or protection bypasses are introduced.

## Scope and known gaps

This change incorporates the four-route work from still-open PR #3; it supersedes
that PR without closing or merging it. Mocks are sandbox-only, in-memory, and not
a production backend. Real API, databases, auth implementation, generated hey-api
clients, and a real-environment verification gate remain intentionally unbuilt.
Existing evidence moved under the owning app. Historical handoff documents refer
to the old layout; this README and ADR-002 are authoritative for the new layout.
