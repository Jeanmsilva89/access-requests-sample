# New-app checklist

Complete this in the new app's PR. `access-requests` is an example, not a library.

- [ ] Agree the domain owner, main-domain/subdomain mapping and versioned interfaces.
      Do not make an existing app proxy or initialize the new app.
- [ ] Create `apps/<name>/package.json` with a unique `@apps/<name>` name, private,
      dependencies, packageManager `pnpm@9.15.9`, and `lint`, `build`, `test:e2e`.
      Own all frontend/backend dependencies in this app, not root.
- [ ] Put frontend, API, local client, database schema/migrations (if any), env,
      tests, runbooks and evidence inside this app. No sibling imports, shared
      databases, startup scripts or runtime dependencies. Shared must not import apps.
- [ ] Add only justified generic utilities to `packages/shared`; never share auth,
      authorization/session implementations, domain models or API clients.
- [ ] Implement authn/authz using [the guide](auth-and-authz.md): shared IdP,
      app-specific audience/roles, host-only cookies and server-side authorization.
- [ ] Declare ports and public build-time vs private server env in an app README.
      Add nonsecret `.env.sandbox`/`.env.example`; ignore local secret `.env` files.
- [ ] Put sandbox-only mocks at the app root, external to frontend. Mark every
      response `X-Mock: true`, expose CORS header, implement deterministic test reset,
      reject production execution. Frontend gets base URLs only from environment.
- [ ] Detect mock header and show a visible sandbox banner on all frontend routes.
- [ ] Add local Playwright config, manage this app's test servers/ports, and cover
      navigation, banner, create, validation and domain behavior. Never run reset
      tests against stage/production. Document real-API verification separately.
- [ ] Add app-owned multi-stage Dockerfile with `web` and explicit `sandbox` targets
      (CI contract; adapt the workflow deliberately for a non-web app). Use explicit
      COPY of selected app/shared only. Default target must never run mocks.
- [ ] Document independent image tags, env, ports, health checks, DB migration ownership,
      deploy and rollback. Configure host routing directly to app, not via another app.
- [ ] Run `pnpm install`, commit root lockfile, then install frozen and run app lint,
      build, e2e and Docker builds. Run root boundary guard and its negative tests.
- [ ] Verify CI path selection: `apps/<name>/**` is automatically discovered by
      `scripts/changed-apps.mjs`; add custom external config paths there if needed.
      Verify an app-only change does not select sibling apps and shared changes do.
- [ ] Preserve stable `build` and `e2e` gates, including on docs-only PRs; confirm
      main still requires both, branches up-to-date and administrators included.
- [ ] Link app README from root docs and write an ADR for changed boundary/deploy rules.
- [ ] Open feature-branch PR with test results/evidence, wait for green, never bypass
      protection or force push; merge only when explicitly authorized.
