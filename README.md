# Access Requests Sample

Minimal monorepo that proves the reliable internal-app plan.

## What it proves

- Segregated apps/web (React + Vite) + apps/api (Fastify) with feature colocation
- Root-level `mocks/` completely separate from application code
- Selective mocking via pure `.env` (application code is unaware of mocks)
- Single mock server with path prefixes, stateful in-memory store, reset, and scenario support
- Optional error and latency injection via request headers (`X-Mock-Error`, `X-Mock-Delay`)
- `X-Mock` response header + visible UI banner when mocks are used
- hey-api style generated clients (simulated) from OpenAPI
- Biome for lint and format
- Playwright deterministic test generated for the feature that runs in CI
- Two-phase verification concept: sandbox for agent velocity, real required before merge

## Quick start

```bash
pnpm install
pnpm --filter mocks dev          # starts mock server on :4010
# In another terminal, with .env pointing at mocks:
pnpm --filter web dev
pnpm --filter api dev
# Run the deterministic test:
pnpm exec playwright test
```

See `docs/adr-001-architecture.md` for the decisions.