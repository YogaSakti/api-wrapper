# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager is **yarn**.

- `yarn dev` — run with live reload (nodemon + ts-node, no build needed)
- `yarn build` — compile TypeScript to `dist/` (`tsc`)
- `yarn start` — run compiled `dist/index.js` (production / Railway `Procfile`)
- `yarn test` — mocked Jest suite (no network)
- `yarn test:live` — live tests against real exchange APIs (sets `RUN_LIVE_TESTS=true`, runs `test/live`, `--runInBand`)
- `yarn test:coverage` — mocked suite with coverage

Single test / focused run (use `npx jest`, not the yarn script, to pass args):
- One file: `npx jest test/earn.test.ts`
- By name: `npx jest test/earn.test.ts -t "returns data"`

Typecheck without emitting: `npx tsc --noEmit`. Lint: `npx eslint src` (eslint configured via `.eslintrc.js`; there is no lint yarn script).

## Critical repo conventions

- **`test/` is git-ignored** (`/test` in `.gitignore`). Tests live on disk and run locally but are **not committed**. `git add test/...` fails without `-f` — do not try to commit test changes. Still write/run them to verify work.
- **`/docs` is git-ignored** — used for local design/plan artifacts (e.g. the superpowers brainstorming/planning workflow). Do not commit it.
- Default branch is `dev` (this repo commits feature work directly onto `dev` historically).

## Architecture

Express 5 API wrapper that aggregates data from crypto exchanges and price sources. TypeScript, CommonJS, compiled with `tsc`.

**Request pipeline** (`src/api.ts`): `helmet` → global rate limiter (120/min, skipped when `NODE_ENV=test`) → CORS (allowlist from `ALLOWED_ORIGINS`, allow-all if empty) → `morgan` logger with a custom format that **sanitizes** URLs (redacts `/balances/:key`) and auth headers → body parsers → routes mounted at `/api/v1` → a global error handler **registered last** that hides stack traces unless `NODE_ENV !== 'production'`.

**Routing** (`src/routes/index.ts`): mounts `cmc`, `artatix`, `earn`, `balances`, `price` under `/api/v1`. (Note: the README documents `/stable/*` endpoints, but no `stable` router is mounted — treat the README as partially stale; trust `src/routes/index.ts`.)

**Three layers:**
- `src/routes/*` — Express routers. Each route module **owns its own `CacheService` instance and TTL** and validates query/params via `src/utils/validation.ts`. Handlers are wrapped in `express-async-handler`.
- `src/services/*` — external integrations and business logic. The `earn/` and `balances/` directories are split one-file-per-exchange and re-exported through a barrel `index.ts`.
- `src/utils/*` — `cache.service.ts` (node-cache wrapper), `validation.ts`, `app-error.ts`.

**Caching pattern:** `CacheService.get(key, async () => fetcher())` is memoize-on-miss with a per-instance `stdTTL`. Some routes intentionally bypass the cache (call the fetcher directly).

**Earn service pattern** (`src/services/earn/<exchange>.service.ts`): each exported fetcher is named `data_<Exchange>[_<Product>]`, is `async`, returns `Promise<EarnAprItem[]>` (`{ name, APR }`, APR as a decimal e.g. `0.05`), and **catches its own errors returning `[]`** so one failing exchange never breaks an aggregate response. Adding a product = clone the nearest fetcher, change the upstream params, export it from the barrel, add a route, wire the test mock. Exchange scraping uses `cross-fetch` with an optional **SOCKS5 proxy** (`SOCKS5_AGENT` env, applied as `agent` when set) and per-service header constants whose cookies come from env (e.g. `BYBIT_COOKIE`).

**Balances endpoint is key-protected** (`src/routes/balances.ts`): requires `ACCESS_KEY` env (process **fails fast at startup** if unset or < 10 chars), enforced by a strict rate limiter (30 / 15 min) and a `validateKey` middleware that accepts the key via `x-api-key` header, `Bearer` token, or path param and compares constant-time.

## Testing notes

- Default tests **mock the service layer** (`jest.mock('../src/services/...')`) and exercise routers via `supertest` — they assert validation, cache behavior, auth, and response shapes without network calls. Config: `jest.config.js` (ts-jest, `restoreMocks: true`, setup in `test/setup.ts`).
- Live tests in `test/live/` are excluded from `yarn test` and only run via `yarn test:live` with real `.env` credentials. Optional live vars: `LIVE_CMC_DEX_PLATFORM`, `LIVE_CMC_DEX_ADDRESS`, `LIVE_ARTATIX_TICKET_SLUG`, `LIVE_KAMINO_VAULT`, `LIVE_KAMINO_ADDRESS`.

## TypeScript config gotcha

`strict: true` but **`strictNullChecks: false`** and **`noImplicitAny: false`** (`tsconfig.json`) — null-safety and implicit-any are NOT enforced. Don't assume the compiler catches null/undefined access.

## Environment

Copy `.env.example` → `.env`. Server `PORT` defaults to `3333`. Keys per exchange (`KEY_*`/`SECRET_*`, plus `PASS_*` for OKX/Bitget), `CMC_API_KEY` / `CMC_DEX_API_KEY`, `ACCESS_KEY` (balances), optional `SOCKS5_AGENT` proxy and `*_COOKIE` session cookies.
