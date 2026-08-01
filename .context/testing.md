# Testing Standards

## Framework

Vitest (configured, not yet used):

```bash
npm test                # Run tests (watch mode)
npm run test:ui         # Run tests with Vitest UI
npm run test:coverage   # Run with coverage report
```

## Current state

No test files exist in this repo yet (`**/*.test.ts` / `**/*.test.tsx` are excluded from
`tsconfig.json`'s `include` and from ESLint's lint set, but none have been written). The
Vitest tooling is ready; treat any new feature or bug fix in `src/services/dataProcessor.ts`,
`cryptoUtils.ts`, or the calculation hooks as an opportunity to add the first real coverage
there rather than starting with UI snapshot tests.

## Where new tests should live

Co-locate as `*.test.ts` / `*.test.tsx` alongside the source file, matching the sibling
EPiC-* repos' convention:
```
src/services/dataProcessor.test.ts
src/hooks/useChartData.test.ts
```

## Priority order for first coverage

1. `src/services/dataProcessor.ts` — the calculation engine; highest value, currently
   the least protected part of the app.
2. `src/services/cryptoUtils.ts` — must match the backend's `_derive_key`/`encrypt_data`;
   a silent mismatch is otherwise only caught by manual testing.
3. `src/contexts/AuthContext.tsx` — login/refresh/logout state transitions.
4. Component-level tests (`@testing-library/react` is not yet installed — add it when
   the first component test is written).

## What NOT to test

- Plotly.js / Three.js internals — mock at the component boundary.
- The Flask backend's response shape in detail — mock `regressionApiService` calls.

## Coverage target

No enforced threshold yet (no CI gate — see quality-gates.md). Aim for meaningful
coverage of `dataProcessor.ts` and `cryptoUtils.ts` before broadening.
