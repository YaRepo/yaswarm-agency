---
name: notebooklm-mcp-operator
description: "Operate NotebookLM through MCP for notebook discovery, source ingestion, querying, and research workflows with auth-aware reliability checks. Use when the user asks to work with NotebookLM notebooks or outputs."
scope: global
contexts:
  - general
  - shapeshifter
  - paradox-saga
---

# NotebookLM MCP Operator

## Overview
Use this skill to run NotebookLM workflows safely and reliably through the installed `notebooklm` MCP server.

## Use This Skill When
Use when the user asks to list notebooks, inspect notebook content, add sources, run NotebookLM queries, or produce NotebookLM-derived outputs.
- User asks for NotebookLM notebook discovery or notebook status.
- User asks to add/manage NotebookLM sources (Drive, URL, text).
- User asks to query a notebook and extract answers from existing sources.
- User asks for NotebookLM artifacts (audio, video, report, slide deck, infographic, flashcards, quiz, mind map, data table).
- User asks for Codex + NotebookLM orchestration workflows.
- User asks across non-business domains (coding/dev, writing, art/design, books/publishing, film, marketing).

## Terminology Normalization
- Replace references to `AntiGravity` with `Codex` action/orchestration layer.
- Keep `NotebookLM` as the research/analysis generation layer.

## Available NotebookLM MCP Tools
- Research: `research_start`, `research_status`, `research_import`
- Notebook read/write: `notebook_list`, `notebook_get`, `notebook_describe`, `notebook_create`, `notebook_rename`, `notebook_delete`
- Source management: `notebook_add_url`, `notebook_add_text`, `notebook_add_drive`, `source_list_drive`, `source_get_content`, `source_describe`, `source_sync_drive`, `source_delete`
- Q/A and settings: `notebook_query`, `chat_configure`
- Artifact generation: `audio_overview_create`, `video_overview_create`, `report_create`, `slide_deck_create`, `infographic_create`, `data_table_create`, `flashcards_create`, `quiz_create`, `mind_map_create`
- Studio monitoring: `studio_status`, `studio_delete`

## Workflow
1. Preflight checks.
- Confirm MCP server exists: `codex mcp get notebooklm`.
- Confirm auth exists and is valid. If missing/expired, run `notebooklm-mcp-auth`.
- If local verification is needed, run `~/yamac-core/scripts/verify_notebooklm_mcp.sh`.

2. Intent classification (required).
- Classify request into one primary domain before selecting a notebook:
- `coding-dev`, `backend`, `frontend`, `writing-fiction`, `writing-nonfiction`, `art-design`, `books-publishing`, `film-production`, `marketing`, `business`, or `general-research`.
- If intent is unclear, ask one clarification question before any write action.

3. Notebook discovery and selection.
- Start with `notebook_list` and identify candidate notebook IDs.
- Use `references/notebook_topic_map.md` as the first routing map.
- If multiple candidates match, pick the best topical notebook and state selection.
- If ambiguity remains, ask user to choose explicitly before writes.
- Hard guardrail: do not route to `Business Brain - Codex Business Operating System` unless the user explicitly asks for business/monetization/offer/GTM/KPI topics.

4. Execution by intent.
- Discovery/read: `notebook_list`, `notebook_get`, `notebook_describe`.
- Source ops: `notebook_add_url`, `notebook_add_text`, `notebook_add_drive`, `source_list_drive`.
- Analysis: `notebook_query`, `source_get_content`.
- Research/studio: `research_start`, `research_status`, `research_import`, `studio_status`.
- Artifacts: `audio_overview_create`, `video_overview_create`, `report_create`, `slide_deck_create`, `infographic_create`, `data_table_create`, `flashcards_create`, `quiz_create`, `mind_map_create`.

5. Codex orchestration handoff.
- After NotebookLM outputs are generated, Codex handles automation and delivery steps (app build, dashboards, task wiring, publishing workflows).
- Keep separation explicit: NotebookLM generates intelligence/assets; Codex executes build/automation.

6. Result normalization.
- Return notebook IDs, URLs, artifact IDs, and concise findings.
- Separate facts from inferred conclusions.
- Include next action options with exact tool/action names.

## Canonical Recipe Patterns
1. Agentic system architecture (dev).
- Route to dev notebook(s) first, never business notebook by default.
- `notebook_query` for architecture patterns -> `data_table_create` for agent-role matrix -> Codex implementation backlog and milestones.

2. Course creator.
- `research_start` -> `source_get_content` -> `video_overview_create` + `audio_overview_create` + `quiz_create` + `flashcards_create` -> Codex delivery build.

3. Competitor intelligence.
- Ingest sources -> `research_start` -> `report_create` + `infographic_create` + `data_table_create` -> Codex alerting/dashboard automation.

4. Content repurposing engine.
- `research_start` -> `report_create` + `video_overview_create` + `audio_overview_create` + `infographic_create` + `slide_deck_create` + `mind_map_create` + `notebook_query` -> Codex channel packaging.

5. Due diligence/decision support.
- Source ingestion -> `report_create` + `data_table_create` + `infographic_create` + `notebook_query` -> Codex decision dashboard.

## Safety Rules
- Never expose raw auth cookies/tokens in output.
- Never run destructive notebook actions (`notebook_delete`, `source_delete`, `studio_delete`) unless user gives explicit confirmation.
- Never assume a notebook ID from title alone when ambiguity exists.
- If auth fails, stop and repair auth first instead of retrying writes blindly.

## Resources
- MCP verifier: `~/yamac-core/scripts/verify_notebooklm_mcp.sh`
- Auth cache path: `~/.notebooklm-mcp/auth.json`
- Topic routing map: `references/notebook_topic_map.md`

## Output Contract
1. Preflight status (MCP present, auth status, verification state).
2. Notebook selection/result summary with notebook IDs and URLs.
3. Executed operations and outputs (read/write/query/research/artifacts) with clear status.
4. Codex handoff actions (what should be built/automated next).
