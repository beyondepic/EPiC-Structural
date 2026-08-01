# Architecture

## Overview

EPiC Structural Dashboard is a React 18 + TypeScript SPA for structural engineering
performance analysis: it visualizes environmental impact (GHG, Energy, Water, Mass)
across building materials and structural systems, with live-adjustable parameters
and a 3D building preview.

**Frontend:** React 18.3 + TypeScript 5.9 (loose mode) + Vite 6
**Styling:** CSS Modules (co-located `*.css` per component) + Tailwind CSS v4 utilities
**Visualization:** Plotly.js + react-plotly.js (2D charts), Three.js (3D building preview)
**Routing:** React Router DOM v7
**Auth:** Custom JWT flow against the bundled Flask backend (not Keycloak, unlike the
other EPiC-* frontends — see Auth below)
**PDF/image export:** `@react-pdf/renderer`, `html2canvas`

## Key Directories

```
src/
  App.tsx                      # Root component, layout, control wiring
  components/
    Header.tsx                 # App header
    ControlPanel.tsx           # Parameter controls (materials, system, shape)
    ChartWidget.tsx / ChartWidget_new.tsx  # Material comparison charts (Plotly)
    DataSummaryWidget.tsx      # Performance metric summary cards
    BuildingVisualizer.tsx     # Three.js 3D building preview
    MaterialTable.tsx          # Material data table
    LoginForm.tsx              # Auth form
    PDFExport/                 # PDF report generation
    [[Multi]SelectControl|DropdownControl|CheckboxListControl].tsx  # Reusable inputs
  contexts/
    AuthContext.tsx            # JWT auth state, login/refresh/logout
  hooks/
    useControls.ts             # Control (parameter) state
    useChartData.ts            # Chart data derivation
    useMultiFlowChartData.ts   # Multi-material flow chart data
  services/
    dataProcessor.ts           # Core LCA/MFA calculation engine
    constants.ts                # Environmental flows, materials, systems, shapes
    cryptoUtils.ts              # AES helpers matching the backend's encrypted payloads
    regressionApiService.ts     # Client for backend/flask_regression_api.py
backend/
  flask_regression_api.py      # Flask app: auth (JWT) + regression-data endpoints, Postgres-backed
  requirements.txt
```

## Backend

Unlike the sibling EPiC-* frontends (which call the shared NestedPhoenix Django API via
Keycloak-issued JWTs), this repo ships its **own** single-file Flask backend
(`backend/flask_regression_api.py`, port 8002):

- `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` — custom JWT auth (flask-jwt-extended)
- `GET /auth/encryption-key` — AES key exchange; response payloads are encrypted with a
  key derived from a password/salt (see `encrypt_data`/`decrypt_data` in the same file)
- `POST /backend/regression-data/`, `POST /backend/regression-data/batch/`,
  `GET /backend/regression-data/combinations/` — regression dataset queries against Postgres
- `GET /health` — liveness

`src/services/regressionApiService.ts` and `src/services/cryptoUtils.ts` are the frontend's
matching client and decryption logic. Do not assume the shared BeyondEPiC `api-dev.beyondepic.io`
gateway applies here — this repo's backend is standalone.

## State Management

- No React Query, no Redux/Zustand.
- `AuthContext` holds the JWT and user; components read it via a custom hook.
- Chart/control state lives in `useControls` / `useChartData` / `useMultiFlowChartData`,
  passed down as props from `App.tsx`.

## Calculation Engine

`src/services/dataProcessor.ts` is the single source of truth for LCA/MFA math:
environmental-impact-per-material, per-system, per-building-parameter calculations.
`src/services/constants.ts` defines the domain vocabulary (materials, systems, shapes,
flow types) that `dataProcessor.ts` and the UI controls both read from — change the
vocabulary there first, calculations second.
