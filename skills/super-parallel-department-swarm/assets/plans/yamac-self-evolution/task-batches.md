# Swarm Task Batches - yamac-self-evolution

- Mode: `audit-and-upgrade`
- Max parallel departments: `5`
- Orchestrator: `swarm-orchestrator`

## Parallel Waves

### Wave 1
- `art-dev` (Art Development)
  deps: none
  primary skills: yamind-design-canvas-design, yamind-design-image-enhancer, yamind-design-cover-designer
  deliverables: style_tokens, asset_plan, production_notes
- `backend-coding` (Backend Coding)
  deps: none
  primary skills: yamind-dev-mcp-builder, yamind-dev-langsmith-fetch, yamind-dev-create-pull-request
  deliverables: architecture_plan, api_contracts, reliability_checks
- `writing-fiction` (Writing Fiction)
  deps: none
  primary skills: book-novel-storylab, yamind-writing-scene-writer, yamind-writing-plot-architect, yamind-writing-character-psychologist
  deliverables: story_structure, scene_plan, revision_notes
- `writing-nonfiction` (Writing Non-Fiction)
  deps: none
  primary skills: yamind-writing-content-research-writer, research-digest-builder, content-publishing-pipeline
  deliverables: outline, evidence_grid, draft_blocks

### Wave 2
- `frontend-coding` (Frontend Coding)
  deps: backend-coding, art-dev
  primary skills: frontend-intentional-minimalism-architect, frontend-library-compliance-guard, yamind-dev-web-design-guidelines
  deliverables: component_plan, accessibility_checks, ui_tasks
- `film-production` (Film Production)
  deps: writing-fiction, art-dev
  primary skills: filmmaking-producer, yamind-writing-showrunner-expert, yamind-writing-prose-cinematographer
  deliverables: treatment, shot_plan, production_schedule

### Wave 3
- `marketing` (Marketing)
  deps: frontend-coding, writing-nonfiction, art-dev
  primary skills: content-publishing-pipeline, yamind-writing-competitive-ads-extractor, portfolio-pitch-builder
  deliverables: messaging_matrix, experiment_plan, reporting_cadence

### Wave 4
- `business-opportunities` (Business Opportunities)
  deps: marketing, backend-coding, frontend-coding
  primary skills: project-to-business-architect, creator-finance-ops, legal-admin-tracker
  deliverables: offer_ladder, pricing_hypothesis, kpi_board

## Weekly Operating Cadence
- Monday: orchestrator planning + dependency checks
- Tuesday-Thursday: execution by wave with owner-only rework
- Friday: integration QA gates + risk review + next-wave planning

## Quality Gates
- `technical_correctness`
- `ux_accessibility`
- `content_clarity`
- `strategy_risk`
