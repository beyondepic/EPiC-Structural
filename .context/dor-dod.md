# Definition of Ready (DoR) & Definition of Done (DoD)

## Definition of Ready (DoR) — User Stories

Work enters a sprint only when ALL of these criteria are met.
Incomplete items remain in the backlog.

### Required (blocking)

- [ ] Story has a clear, testable user story: "As a [role], I want [action], so that [outcome]"
- [ ] Acceptance criteria are specific and measurable (not "works correctly")
- [ ] Story is estimated (points or T-shirt size)
- [ ] Dependencies are identified and unblocked (or explicitly accepted as risks)
- [ ] No open questions that would block implementation

### Additional for UI/Frontend work

- [ ] Acceptance criteria include visual references (screenshots or design links)
- [ ] Step-by-step expected behaviors are documented
- [ ] Responsive breakpoints specified (375px mobile, 768px tablet, 1280px desktop)

### Additional for Epics

- [ ] KPIs are defined and measurable
- [ ] Engineering has reviewed; dependencies and risks are documented
- [ ] Stories are broken down and individually ready

---

## Definition of Done (DoD) — User Stories

A story is done only when ALL of these criteria are met.

### Implementation & Developer Verification

- [ ] Feature works as specified in acceptance criteria
- [ ] `npm run lint` and `npm run type-check` pass with no new violations
- [ ] No new `eslint-disable` suppression comments
- [ ] Code reviewed and approved by at least one peer
- [ ] No dead code, `console.log`, or debug artifacts left in
- [ ] Follows `.context/conventions.md`

### Testing & Acceptance

- [ ] New logic in `src/services/` has a Vitest test where practical (see testing.md —
      this repo currently has zero tests, so any new coverage is a net improvement)
- [ ] Manual smoke test performed against `npm run dev`
- [ ] No regression in related flows

### Documentation

- [ ] `.context/` files updated if architecture/conventions/footguns changed
- [ ] Backend API changes documented (endpoint, request/response shape, encryption impact)

### Deployment

- [ ] PR merged to main
- [ ] `npm run build:check` succeeds locally (no CI gate exists yet — see quality-gates.md)

---

## AI Agent Enforcement

When an AI agent completes a task, it must self-assess against this DoD before marking done:

1. Run `npm run lint && npm run type-check && npm run build:check` — all must pass
2. Verify acceptance criteria one by one — each must be demonstrably met
3. Check no suppression comments were added
4. If any DoD item fails: keep status as in_progress, fix, re-verify

**An agent MUST NOT mark a task complete if any DoD item is unmet.**
It must either fix the issue or escalate with a specific description of what is blocked.
