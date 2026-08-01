# Code Conventions

## TypeScript

- Loose mode: `strict: false`, `noImplicitAny: false`, `strictNullChecks: false` in
  `tsconfig.json` — this is a deliberate migration stance (see footguns.md), not an
  invitation to skip typing new code. Type new functions and props properly even
  though the compiler won't force you to.
- Path alias `@/*` → `src/*` (configured in both `tsconfig.json` and `vite.config.ts`).

## Formatting

Prettier, enforced via `npm run format` / `npm run format:check`:
- Double quotes off (`singleQuote: false` → double quotes), semicolons on,
  `trailingComma: "es5"`, `printWidth: 80`, 2-space indent.

## Naming

- Components: `PascalCase.tsx` with a co-located `PascalCase.css`
- Hooks: `useHookName.ts`
- Services: `camelCase.ts`
- Context: `PascalCase Context.tsx` (e.g. `AuthContext.tsx`)

## Styling

- **CSS Modules by convention** (not the `.module.css` suffix — plain co-located
  `Component.css` imported directly): each component owns its own stylesheet.
- Tailwind v4 utilities for spacing/layout only; don't fight CSS Module rules with
  Tailwind overrides on the same element.
- Global CSS custom properties live in `src/App.css` (`--primary-color`, etc.).

## Components

- Keep components focused; extract reusable controls (`DropdownControl`,
  `CheckboxListControl`, `MultiSelectControl`) rather than inlining form widgets.
- Business/calculation logic belongs in `src/services/`, never inline in a component.

## Comment Policy

Comment only the WHY — non-obvious constraints, backend quirks, or workarounds.
Never comment WHAT the code does.
