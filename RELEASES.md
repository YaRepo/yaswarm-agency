# Releases

## Versioning

YaSwarm Agency uses semantic versioning:
- MAJOR: breaking changes
- MINOR: backward-compatible features
- PATCH: backward-compatible fixes

Current pre-release: `1.0.0-alpha.1`

## Upgrade policy

Use:

```bash
yaswarm upgrade --dry-run
yaswarm upgrade
```

Upgrade scripts are additive and should preserve workspace data.
