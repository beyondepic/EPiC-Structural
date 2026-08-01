# Evidence & Screenshots Convention

AI agents and engineers follow this convention when capturing and attaching evidence to PRs
and work items.

## Storage Location

```
.ai/artifacts/pr-<N>/evidence/
```

- `<N>` is the PR number
- Create the directory before capturing evidence
- Never commit this directory — add it to `.gitignore` if not already covered

## Standard Viewports

Capture evidence at these viewports for UI changes:

| Viewport | Width | Use |
|---|---|---|
| Mobile | 375px | Required for any UI change |
| Tablet | 768px | Required for layout changes |
| Desktop | 1280px | Required for all UI changes |
| Wide | 1920px | Optional; only for wide-layout features (e.g. multi-chart comparison view) |

## Evidence File Naming

```
<feature>-<viewport>-<state>.png
```

Examples:
- `material-comparison-desktop-default.png`
- `building-visualizer-mobile-loading.png`
- `chart-widget-tablet-error-state.png`

**States to capture:**
- `default` — normal loaded state
- `loading` — skeleton/spinner state (if applicable)
- `error` — error state (e.g. regression-data decrypt failure, backend unreachable)
- `empty` — empty/zero-data state (if applicable)

## Video Recordings

For complex interactions (3D building rotation, drag-drop, multi-chart carousel):

```
<feature>-<viewport>-<interaction>.mp4
```

Keep recordings under 30 seconds. Trim silence at start/end.

## Backend evidence

When a change touches `backend/flask_regression_api.py`, also capture the raw request/response
(with any encrypted payload decrypted for readability) as `<endpoint>-response.json` in the
same evidence directory — screenshots alone don't verify calculation correctness.

## AI Agent Checklist

Before marking a UI story as Done, an agent must:

1. Capture screenshots at mobile (375px) and desktop (1280px) at minimum
2. Name files per convention above
3. Store in `.ai/artifacts/pr-<N>/evidence/`
4. Reference evidence filenames in the PR description

Evidence without proper naming will be rejected during PR review.
