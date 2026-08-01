# Project Identifiers

## Client

- **Client:** `beyondepic`
  <!-- REQUIRED. Lowercase, no punctuation. This is the primary key the memory
       resolver uses to load client-level context, and it is declared rather than
       derived from the git remote on purpose: forks resolve to the fork owner,
       the client can be on `upstream` while `origin` is personal, submodules
       resolve their own remote, monorepos can hold two products, orgs get
       renamed, and one client can span two orgs.

       This repo is the easy case (org and client happen to match), which is
       exactly why it must still be stated. A value that is correct by
       coincidence is not a source of truth. -->

## GitHub

- **Org:** beyondepic
- **Repo:** beyondepic/EPiC-Structural
- **Default branch:** main

## Jira / ticket tracking

Not currently in use for this repo — branch history shows no ticket-prefixed branch
names (unlike `NestedPhoenix`, which uses `NP-<n>`). If Jira adoption starts here,
record the project key in this section rather than inventing one.

## Cloudflare / hosting

No Cloudflare Pages project exists for this repo yet (no `.github/workflows/` — see
infrastructure.md). The sibling EPiC-* frontends deploy to Cloudflare account
`d23f7dc3a95be4b16d082a58933adee7`; if this repo is onboarded to that stack, its Pages
project name should follow the `epic-structural` / `epic-structural-dev` convention
used by `epic-admin`, `epic-explorer-dev`, `epic-urban-dev`.

## SonarCloud

Not configured for this repo.

## Backend (standalone)

- **Local API:** `http://localhost:8002` (`backend/flask_regression_api.py`)
- **Database:** Postgres (connection via env, see `get_db_connection()` in that file)
- Not part of the shared `api-dev.beyondepic.io` gateway used by the other EPiC-* frontends.

## Local dev

- **Dev server:** http://localhost:5175 (collides with EPiC-Explorer — see footguns.md)
- **Preview server:** http://localhost:4175
