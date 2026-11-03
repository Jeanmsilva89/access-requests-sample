# Access Requests Sample

Minimal monorepo that proves the reliable internal-app plan: a Vite React web app talking to an external Fastify mock server via env-configured base URLs, with Playwright e2e coverage.

## Architecture rules

- **Mocks at repo root** (`mocks/`), completely external to the app
- **App only reads base URLs from env** (`VITE_API_BASE_URL`) and never knows it is talking to a mock
- **Mock always sets `X-Mock: true`** on every response (and exposes it via CORS)
- **UI shows a yellow sandbox banner** when that header is present
- **Mocks are sandbox-only** — `.env.sandbox` / local `.env` point at `http://localhost:4010`, never stage or production
- **No real credentials** in the repo

## Feature: approve / deny pending requests

Reviewers can **Approve** or **Deny** a `pending` request from the list:

- Mock: `PATCH /requests/:id` with `{ "status": "approved" | "denied" }`
- Client: `updateRequestStatus(baseUrl, id, { status })`
- UI: Approve/Deny buttons only on pending rows; status badge updates; visible error on failure
- Deterministic e2e via `POST /__reset` on the mock

## Prerequisites

- Node.js 20+
- [pnpm 9](https://pnpm.io) (`corepack enable` or install into `~/.local`)
- Playwright Chromium (`pnpm exec playwright install chromium`)

## Quick start

```bash
pnpm install

# Terminal 1 — mock API on :4010 (always sets X-Mock: true)
pnpm --filter mocks start
# or with reload: pnpm --filter mocks dev

# Terminal 2 — web app on :5173 (reads VITE_API_BASE_URL from apps/web/.env*)
pnpm --filter web dev

# Terminal 3 — Playwright e2e (expects both servers already running)
pnpm test:e2e
```

Root `.env.sandbox` and `apps/web/.env.sandbox` / `apps/web/.env` should contain only:

```bash
VITE_API_BASE_URL=http://localhost:4010
```

Do not commit secrets. `.env` is gitignored; `.env.sandbox` with localhost URLs is fine.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm --filter mocks start` | Mock server on port 4010 |
| `pnpm --filter web dev` | Vite React app on port 5173 |
| `pnpm test:e2e` | Playwright tests in `e2e/` |
| `pnpm lint` / `pnpm format` | Biome |

## Evidence

Video and screenshots from the approve/deny e2e run live under `docs/evidence/` (when committed) and were also collected under `/workspace/access-requests-evidence/` during local runs.

See `docs/adr-001-architecture.md` for the decisions.
