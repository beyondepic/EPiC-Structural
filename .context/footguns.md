# Footguns & Common Pitfalls

## Dev server port collides with EPiC-Explorer

This repo's Vite dev server is fixed to **port 5175** (`vite.config.ts`). EPiC-Explorer's
`vite.config.ts` is *also* configured for port 5175 — the port-allocation note in the old
CLAUDE.md (EPiC-Admin 5174 / EPiC-Explorer 5173 / EPiC-Structural 5175) is stale; verified
2026-08-01 that EPiC-Explorer currently binds 5175 too. If `npm run dev` in either repo
silently fails to bind or you see another project's app, run `lsof -i :5175` before
assuming which dev server owns the port.

## Standalone backend, not the shared gateway

This repo's backend (`backend/flask_regression_api.py`, port 8002) is a bespoke Flask app,
not the shared NestedPhoenix/Keycloak stack the other EPiC-* frontends use. Do not port
auth patterns from EPiC-Admin/Explorer/Urban (Keycloak JWT via `VITE_KEYCLOAK_*` env vars)
into this repo without first confirming whether the standalone Flask auth is being retired
in favour of the shared stack — check `MIGRATION.md` before assuming either direction.

## Encrypted API payloads

Regression-data responses are AES-encrypted server-side (`encrypt_data` in
`flask_regression_api.py`) using a key derived from `GET /auth/encryption-key`.
`src/services/cryptoUtils.ts` must stay in lock-step with the backend's derivation
(`_derive_key`) — a mismatch fails silently as garbled JSON, not a clear error.

## Loose TypeScript mode

`strict`, `noImplicitAny`, and `strictNullChecks` are all off. This was a deliberate
choice during the CRA → Vite → TypeScript migration (see `MIGRATION.md`) to allow
gradual typing. It means the compiler will not catch null/undefined access or implicit
`any` — code review has to catch what the compiler won't.

## Plotly.js needs the buffer polyfill

Plotly.js assumes a Node `Buffer` global that doesn't exist in the browser. `vite.config.ts`
aliases `buffer` → `buffer/` and defines `global: globalThis` — if you see
`ReferenceError: Buffer is not defined` after a dependency bump, check this alias survived
the change, and that `buffer` is still in `devDependencies`.

## No CI configured yet

Unlike its EPiC-* siblings, this repo currently has **no `.github/workflows/`** — lint,
type-check, test, and build are local-only (`npm run lint`, `type-check`, `test`, `build`).
There is no automated gate before merge to `main`; see quality-gates.md for the commands
to run manually before opening a PR.

## Zero tests currently exist

Vitest is configured (`npm test`, `npm run test:coverage`) but no `*.test.ts(x)` files
exist in the repo yet. Do not assume test coverage protects any existing behaviour —
manual verification in the dev server is currently the only safety net.

## Build tooling migration history

Migrated from Create React App → Vite, JavaScript → TypeScript, and off legacy OpenSSL
build workarounds. `MIGRATION.md` documents the full history — check it before "fixing"
something that looks like migration debris.
