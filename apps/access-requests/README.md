# Access Requests — main-domain app

This complete app owns its Mantine/React frontend, domain fetch client, sandbox
Fastify backend, Playwright tests, env, evidence and images. Routes: Dashboard `/`,
Requests `/requests`, New Request `/requests/new`, Audit `/audit`; request details
are a subroute. It imports no sibling app. Shared dependency: the pure X-Mock protocol.

## Local commands

From repository root (Node 22, pnpm 9.15.9):

```sh
pnpm install --frozen-lockfile --filter @apps/access-requests...
pnpm --dir apps/access-requests dev:mocks  # :4010, terminal 1
pnpm --dir apps/access-requests dev        # :5173, terminal 2
pnpm --dir apps/access-requests lint
pnpm --dir apps/access-requests build
pnpm --dir apps/access-requests exec playwright install chromium
pnpm --dir apps/access-requests test:e2e
```

Or `cd apps/access-requests` and run the same scripts without `--dir`. There is one
app package manifest; `web/`, `client/` and `mocks/` are not separate workspaces.
The root lockfile supplies reproducibility, no sibling app build is needed.
Playwright starts/reuses local servers, owns fresh servers in CI, and records
video/screenshots in this app's `test-results/`. Stop existing servers before CI mode.

`dev` loads `.env.sandbox`, containing public `VITE_API_BASE_URL=http://localhost:4010`.
Mocks always send `X-Mock: true` (CORS exposed); banner appears based on responses,
not because frontend knows about mocks. Client base URLs come from env only.
Production `build` does not load `.env.sandbox`: default empty URL is same-origin
API; override `VITE_API_BASE_URL` with an explicit real API URL when building.
Public Vite variables are baked into JS: never use secrets there. Mocks are local
sandbox only; do not point them or reset tests at stage/production.

## Deploy/build this app alone

From root context (Docker copies only this app and shared, not sibling apps):

```sh
docker build -f apps/access-requests/Dockerfile --target web   --build-arg VITE_API_BASE_URL=https://api.example.com   -t access-requests-web:local .
docker run --rm -p 8080:8080 access-requests-web:local
# Verify /, /requests, /requests/new, /audit return the SPA via nginx.
```

`api.example.com` is an example, not a configured endpoint. Frontend image is an
unprivileged nginx SPA server on 8080; it includes no mock server, DB or runtime
pnpm dependency. Configure the actual API's CORS for the frontend host. Empty URL
requires the platform's same-host `/requests` API routing to be designed carefully
because SPA routes also use `/requests`; prefer an explicit API origin for now.
No production backend exists yet, so a deployed static shell alone is not a working
production system. The manifest reserves no fake database: current store is in-memory,
resettable and disposable. When adding a real backend, put `api/`, DB migrations and
backups here with a separate target/image and documented network contract.

Explicit local sandbox image (never stage/production):

```sh
docker build -f apps/access-requests/Dockerfile --target sandbox -t access-requests-sandbox:local .
docker run --rm -p 127.0.0.1:4010:4010 access-requests-sandbox:local
# To pair with sandbox frontend: build web with VITE_API_BASE_URL=http://localhost:4010.
```

`PORT` controls the sandbox listener (default 4010); `NODE_ENV=production` refuses
startup. Sandbox `/health` is its health endpoint. Frontend health: HTTP GET `/`.
Mock API supports requests list/detail/create/approve/deny, audit, and deterministic
`POST /__reset` (legacy `/reset` alias). Data disappears on restart/reset.

Deploy this image directly at the main domain, independently tag and roll it back;
subdomain apps must not route through it. Image versions should use a commit SHA,
not a shared monorepo release number. This PR builds but does not publish/deploy
images. Main protection still requires `build` and `e2e`, strict, admins included.
See repo [auth guidance](../../docs/auth-and-authz.md) before adding real credentials.
