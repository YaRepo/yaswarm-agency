# Releases

## Latest notable updates

### 2026-03-12
- Agency UI now documents and exposes a unified Threads workflow for cross-surface continuity.
- Public docs now describe shared thread-memory / memory-RAG behavior in Agency UI.
- Continuity improvements include reviewable handoff previews, thread-aware Chat/Terminal/Telegram/Memory surfaces, and focused thread-memory navigation.
- Public repo identity is clarified so this monorepo is treated as the clean public product source, distinct from private/operator runtime repos.

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
