# Test-Driven Development (TDD)

## Core Principle

Write the test first. Code only exists to make tests pass.

## The Iron Law

**Never write production code without a failing test first.**

## Red-Green-Refactor

### RED — Write Failing Test
Write the smallest test that describes one behaviour. Run it — confirm it fails.

### Verify RED (MANDATORY)
See the failure. Confirm it's your assertion that fails, not a pre-existing error.

### GREEN — Minimal Code
Write minimum code to pass. Do not over-engineer.

### Verify GREEN (MANDATORY)
Run suite. Confirm your test now passes.

### REFACTOR — Clean Up
Remove duplication, improve names. Run tests after each change.

## Good Tests

- One behaviour per test
- Name: `describe('<module>', () => { it('<does something>', ...) })`
- No logic in tests
- Independent — no shared mutable state
- Mock only at boundaries (the Flask API, encryption key exchange)

## Anti-Patterns

| Anti-Pattern | Fix |
|---|---|
| Testing mock return values | Test real component/service with real state |
| Testing implementation details | Test user-visible behaviour or calculation output |
| Snapshot tests as primary coverage | Write behaviour assertions |
| Testing `regressionApiService` internals directly | Mock at the fetch/axios boundary |
