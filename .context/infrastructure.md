# Infrastructure & CI

## Environment Variables

Copy `.env.example` → `.env`. Vite env vars must be prefixed `VITE_`; the frontend auth
code currently reads `process.env.REACT_APP_API_BASE_URL` (a Create-React-App-era name
left over from the migration — see footguns.md — falling back to `http://localhost:8002`
when unset).

```
VITE_APP_TITLE=EPiC Structural Dashboard
VITE_APP_ENV=development
# VITE_API_BASE_URL=http://localhost:8000   (present in .env.example, not yet wired to the actual client)
```

## Backend (local)

```bash
cd backend
pip install -r requirements.txt
python flask_regression_api.py     # runs on http://localhost:8002
```

Requires a reachable Postgres instance (`get_db_connection` in `flask_regression_api.py`);
connection details are read from environment/`.env`, not hardcoded — check that file
before assuming a fresh checkout can run the backend without configuration.

## Frontend (local)

```bash
npm install
npm run dev          # http://localhost:5175 — see footguns.md re: port collision with EPiC-Explorer
npm run preview      # http://localhost:4175 (after npm run build)
```

## CI/CD

None configured (no `.github/workflows/`). No Docker, no Cloudflare Pages deploy, no
staging/production pipeline exists for this repo today — unlike the sibling EPiC-*
frontends, which deploy to Cloudflare Pages on merge to `main`. Deployment is currently
manual; do not assume a `main` merge here reaches any live environment.

## Related BeyondEPiC infrastructure

This repo does not currently participate in the shared BeyondEPiC Cloudflare/AWS stack
documented in `EPiC-infrastructure`. If/when it's onboarded, that repo's `.context/`
and `docs/architecture/multi-env-design.md` are the source of truth for the shared
dev/staging/prod topology.
