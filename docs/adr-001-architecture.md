# ADR-001: Architecture for reliable internal tools

## Status
Accepted

## Context
We want an internal site that is super reliable and predictable for both humans and agents.

## Decision
- Segregated monorepo (apps/web, apps/api, packages/clients)
- Root-level mocks completely outside application code
- Selective mocking purely via .env (app code unaware)
- hey-api generation from OpenAPI as source of truth
- Local-only patches never committed to release
- X-Mock header + UI banner for visibility
- Playwright for real browser use and deterministic CI tests
- Two-phase verification: sandbox for velocity, real required before merge

## Consequences
Agents can move fast in the sandbox. Reliability comes from the real verification gate and automated checks.
