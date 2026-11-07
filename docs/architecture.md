# App ownership and deployment architecture

## Ownership boundaries

`apps/<name>` is a complete product/deploy unit, with one package manifest owning
all of its dependencies. It may contain `web/`, `api/`, `database/`, `mocks/`, local
clients, migrations, operational docs and tests. These are directories inside an
app, not peer apps. Access Requests currently has no real API or database: its
sandbox API keeps requests and audit events in memory.

One shared package (`packages/shared`) owns the tiny, domain-neutral sandbox header
protocol. It has no network calls, state, app imports, UI, authentication, or domain
models. Any future shared utility must have multiple plausible consumers, remain
pure and backwards-compatible, and be justified by an ADR. Do not share domain
clients just because two apps use HTTP. No app imports another app, directly or
through shared. `scripts/check-boundaries.mjs` rejects static imports/re-exports,
dynamic string imports/require, manifest dependencies, path aliases, and shared
backreferences; tests exercise both accepted and rejected references. This is a
static guard, not a security sandbox against deliberately obfuscated code.

## Domains and reliability

The main-domain app owns `https://example.com`; future apps own, for example,
`https://reports.example.com` with their own DNS/CDN/load-balancer and image.
These are illustrative domains, not provisioned deployments. Configure each host
directly to its app; do not reverse proxy all subdomains through Access Requests.
Navigation between apps uses normal URLs, not imports or a common runtime shell.
No app startup/build requires another app's process or database. Each deployment
has independent secrets, health probes, scaling, releases and rollback. Ordinary
shared infrastructure (DNS, IdP, CI, registry) can still fail; independence is not
an absolute availability guarantee. Cross-app data, if ever needed, requires a
versioned HTTP/event contract, timeouts and graceful degradation, not direct DB access.

## Build and test isolation

The workspace uses a central reproducible lockfile. An app owns its package.json,
TypeScript, Vite, Playwright and Docker configuration. Its image build copies only
root workspace metadata, the selected app and shared; unrelated source is excluded
by explicit COPY, even though the context is the repository root. The shared file
dependency is snapshotted in pnpm/image builds, not resolved at deployment time.

CI calculates a changed-app matrix with `scripts/changed-apps.mjs` (new folders are
automatically discovered). Changes under `apps/X` select X only; changes to shared,
lockfiles, root package/tooling or workflows select all. Repo docs select no app.
Each app implements the standard `lint`, `build`, `test:e2e` scripts and `web` and
`sandbox` Docker targets. Repo validation always runs. Stable gates `build` and
`e2e` explicitly fail on failed/cancelled dependencies; app jobs may skip only when
there are no changed apps. Keep these check names to preserve branch protection.
Deployment remains per-app and manual/external: CI validates images but never pushes
or deploys them. Adding deployment automation requires an app-specific workflow.

## Sandbox vs real

Mocks live at **the app root**, outside frontend code. `X-Mock: true` marks every
sandbox response, including errors; CORS exposes it to the browser. Frontend clients
only receive environment-derived base URLs. The banner is driven by response
headers, never a build-time mock flag. `pnpm dev` explicitly loads `.env.sandbox`;
production builds default to a same-origin API unless `VITE_API_BASE_URL` is passed.
Never point mocks or deterministic reset tests at stage/production.

Historical ADR-001's root-mock placement is superseded by ADR-002; its separation
and visibility requirements remain. Its hey-api and real-verification intentions
are not implemented and must not be represented as completed checks.
