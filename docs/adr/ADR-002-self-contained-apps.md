# ADR-002: Self-contained, independently deployable apps

Status: Accepted for this restructure; proposed code changes await PR review.

## Context

The old repo split one domain across `apps/web`, root `mocks/`, `packages/clients`
and root e2e. Jean requested a true monorepo where a complete app owns its domain,
can have its own backend/frontend/database, and can change or fail independently
of sibling subdomain apps. Shared auth implementation would couple releases.

## Decision

1. Move the complete Access Requests domain to `apps/access-requests`. Keep its
   four Mantine routes/sidebar, local client, mocks, tests, evidence, env, Docker
   configuration and operational docs together under one package manifest.
2. Root contains only workspace/tooling, repo documentation and GitHub automation.
   Keep exactly one tiny generic package, `packages/shared`, for `X-Mock` protocol
   detection/constant. This repeated domain-neutral protocol is safe to share; the
   domain client belongs to the app. No shared business types, auth/session code,
   central runtime shell, cross-app imports, or shared database.
3. **Supersede ADR-001's “mocks at repo root” placement with “mocks at the app
   root, external to frontend code.”** Preserve env-only frontend base URLs,
   `X-Mock: true` on all mock responses, banner on header detection, sandbox-only
   operation and Playwright create-flow/banner checks. No stage/production targets.
4. Each app owns its manifest/tool configuration and images; pnpm's root lockfile
   coordinates reproducibility only. Use a root Docker context with explicit copies
   of this app and shared, not sibling app sources. The production web target is
   the default; sandbox is a separate opt-in target and refuses NODE_ENV=production.
5. Main-domain and subdomain apps have independent routing/deployments/storage.
   Document consistent authentication/authorization using a shared IdP; implement
   validation/enforcement inside each app, not in a shared code package.
6. Enforce static boundaries via a generic script plus negative tests. CI discovers
   changed apps and uses non-cancelling per-app matrices. Shared/tooling changes
   intentionally recheck all consumers. Keep always-reporting `build` and `e2e`
   aggregate gates to preserve strict main protection with administrators included.
7. Document a concrete new-app checklist rather than scaffold a second product.

## Consequences and limitations

- An app's runtime/release has no sibling dependency. Shared changes require
  consumer verification but never force simultaneous deployment.
- One PR touching multiple apps still needs all affected checks. An unrelated
  existing app failure is not run for an app-only change.
- Central tooling and lockfile are development coordination, not runtime coupling.
- Same library dependencies may appear in multiple app manifests; avoid coupling
  applications just to deduplicate dependencies.
- Access Requests has only an in-memory sandbox backend; production API, auth,
  persistent DB, generated hey-api clients and real-environment testing remain gaps.
- PR #3 was open when work began. This branch starts at its head and supersedes it;
  #3 is left open and unmerged for Jean to decide its disposition.

## Alternatives rejected

Separate web/api top-level apps preserve the old coupling. A shared auth library
makes cross-app releases/security behavior interdependent. A speculative template
app adds a product/test/deploy surface without a domain owner. Renaming required
checks risks blocking main, so stable gates are retained.
