---
name: artifacts-builder
description: "Create complex web artifacts using React, Tailwind, and shadcn tooling, then bundle to a single deliverable HTML file. Use when an output needs stateful UI, routing, or richer interaction beyond simple static pages."
license: Complete terms in LICENSE.txt
metadata:
  category: development
  source:
    repository: https://github.com/ComposioHQ/awesome-claude-skills
    path: artifacts-builder
---

# Artifacts Builder

Build multi-component, production-style HTML artifacts from a modern frontend stack and ship a single-file output when required.

## Use This Skill When
- Use when a user requests a rich interactive artifact (dashboard, app-like flow, component-driven page).
- Use when a static single-file HTML is not enough for the requested behavior.
- Use when shadcn-style components, state management, or complex layout composition is needed.
- Use when a final bundled artifact (`bundle.html`) must be generated for sharing.

## Inputs
- Artifact goal and target audience
- Visual direction and UX constraints
- Required components/interactions
- Output format requirements (single file or project folder)

## Workflow
1. Initialize project scaffold.
```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```

2. Implement artifact behavior.
- Build components and page flow.
- Keep readable structure over one-file hacks.

3. Bundle for delivery.
```bash
bash scripts/bundle-artifact.sh
```
- Validate that `bundle.html` exists and opens correctly.

4. Present output.
- Share artifact path and summarize key interaction points.

## Design & Style Guidelines
- Avoid generic AI-looking layouts (over-centered blocks, repetitive card grids, gradient spam).
- Use a clear visual system: type scale, spacing scale, and component hierarchy.
- Prefer intentional interactions over decorative motion.
- Keep accessibility baseline: legible contrast, keyboard navigability, and semantic structure.

## Quick Start
1. Initialize project.
```bash
bash scripts/init-artifact.sh <project-name>
cd <project-name>
```
2. Build artifact with React + Tailwind + shadcn components.
3. Bundle to single-file deliverable.
```bash
bash scripts/bundle-artifact.sh
```
4. Verify `bundle.html` exists and renders correctly.
5. Share the artifact with a short run guide.

Optional test pass:
- Run local preview and smoke test critical interactions before handoff.
- If test tooling is unavailable, report exact blocker and provide manual verification steps.

## Design Baseline
- Favor intentional visual systems over generic defaults.
- Avoid repetitive AI-look patterns (overused center-only layouts, gradient spam, interchangeable cards).
- Keep typography and spacing consistent and purposeful.

## Safety Rules
- Do not run destructive cleanup in user project folders.
- Do not overwrite existing artifact directories without confirmation.
- Keep generated artifact code auditable and minimally surprising.
- If dependencies fail, report exact blocker and fallback path.

## Resources
- Initializer: `scripts/init-artifact.sh`
- Bundler: `scripts/bundle-artifact.sh`
- Component bundle: `scripts/shadcn-components.tar.gz`
- License: `LICENSE.txt`

## Reference
- shadcn/ui docs: `https://ui.shadcn.com/docs/components`
- Use `scripts/init-artifact.sh` and `scripts/bundle-artifact.sh` as the canonical lifecycle.
- Deep reference: `/Users/yascene/YaMind-Writer-Desk/Skills/Dev-Skills/artifacts-builder/SKILL.md`

## Output Contract
1. Initialized artifact project (or updated project) with clear structure.
2. Bundled output (`bundle.html`) when requested.
3. Brief implementation summary and known limitations.
4. Re-run steps for reproducibility.
