# Branch Naming Convention

All BeyondEPiC repositories follow this pattern:

## Pattern

```
<type>/<short-description>
```

| Type | Use for |
|------|---------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `chore` | Maintenance, dependency updates, config |
| `refactor` | Code restructuring without behaviour change |
| `docs` | Documentation only |
| `test` | Adding or fixing tests |

## Examples

```
feat/add-material-comparison-export
fix/regression-data-decrypt-mismatch
chore/update-plotly-v4
refactor/extract-calculation-hooks
```

## Rules

- Lowercase, hyphens only
- 3-6 word description
- Delete branch after merge
