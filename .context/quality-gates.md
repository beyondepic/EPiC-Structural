# Quality Gates

## No CI configured

There is no `.github/workflows/` in this repo (verified 2026-08-01) — unlike the sibling
EPiC-* frontends, nothing runs automatically on push or PR. All of the following are
**manual, local checks** you must run yourself before opening a PR:

```bash
npm run lint            # ESLint — max 50 warnings allowed (see eslint.config.js)
npm run type-check      # tsc --noEmit
npm run format:check    # Prettier format check
npm test                # Vitest — currently zero tests, so this is a no-op pass
npm run build:check     # tsc && vite build — catches type errors the loose tsconfig allows through in dev
```

## Pre-commit

No Husky/pre-commit hook is configured. Run the commands above manually; do not rely
on a hook to catch issues before commit.

## Before opening a PR

- [ ] `npm run lint` — zero new warnings beyond the existing max-50 budget
- [ ] `npm run type-check` passes
- [ ] `npm run format:check` passes (or run `npm run format` to fix)
- [ ] `npm run build:check` succeeds
- [ ] Manually verified in `npm run dev` (there is no automated test coverage backing this yet)

## If adding CI

If this repo adopts a `.github/workflows/ci.yml`, mirror the sibling EPiC-* pattern
(`EPiC-Admin`/`EPiC-Explorer`: lint + format:check + test:coverage + build) rather than
inventing a new one — update this file once that lands.
