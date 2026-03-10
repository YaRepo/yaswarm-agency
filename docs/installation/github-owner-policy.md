# Dedicated GitHub Owner/Org Policy

## Recommendation

Create and use a dedicated GitHub owner/org for YaSwarm activity.

Examples:
- `yourname-yaswarm`
- `your-org-yaswarm`

## Why

- Keeps client/project repos separate from personal repos
- Reduces accidental secret/context leakage
- Makes automation and access control simpler
- Supports cleaner team handoff and audits

## Enforcement

Current setup uses **strong warning** mode:
- It warns on mixed/personal owner usage
- It does not hard-block setup

## Project repo default

`yaswarm init-project` creates **private** repos by default unless `--public` is provided.
