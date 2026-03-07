---
name: super-parallel-department-swarm
description: "Design and run a super-parallel Codex department swarm with a central orchestrator and specialist agents across art, engineering, writing, film, marketing, and business ops. Use when building or evolving multi-agent execution systems."
scope: global
contexts:
  - general
  - shapeshifter
  - paradox-saga
---

# Super Parallel Department Swarm

## Overview
Use this skill to design, deploy, and operate a super-parallel agentic framework where Codex orchestrates specialist department agents with strict handoff contracts, quality gates, and memory continuity.

## Use This Skill When
Use when the user asks to build or improve a multi-agent Codex system with department-level specialization.
- User asks for agentic framework architecture and parallel orchestration.
- User asks to split work into specialist departments (art/dev/backend/frontend/writing/film/marketing/business).
- User asks for roadmaps, routing logic, guardrails, and quality loops for a swarm.
- User asks to scale Codex from single-agent execution into supervised multi-agent execution.

## Department Agents
- Orchestrator: `agents/swarm-orchestrator.md`
- Art Development: `agents/departments/art-dev.md`
- Backend Engineering: `agents/departments/backend-coding.md`
- Frontend Engineering: `agents/departments/frontend-coding.md`
- Fiction Writing: `agents/departments/writing-fiction.md`
- Non-Fiction Writing: `agents/departments/writing-nonfiction.md`
- Film Production: `agents/departments/film-production.md`
- Marketing: `agents/departments/marketing.md`
- Business Opportunities: `agents/departments/business-opportunities.md`

## Workflow
1. Intake and operating mode.
- Capture objective, constraints, timeline, and success metrics.
- Select mode: `design-only`, `implementation`, or `audit-and-upgrade`.

2. Task decomposition and routing.
- Split objective into department work packets.
- Assign one primary owner department per packet.
- Declare expected inputs/outputs for each handoff before execution.

3. Parallel execution.
- Run independent department packets in parallel.
- Keep dependency-ordered packets serialized only where needed.
- Enforce tool ownership boundaries by department.

4. Integration and quality gates.
- Run technical, UX, narrative, and business quality checks at merge points.
- Reject outputs that fail contract or quality threshold.
- Request focused revisions from the owning department only.

5. Memory and continuity.
- Log major system decisions to daily memory and index in SQLite.
- Promote durable operating rules into `MEMORY.md` only after repeated success.

6. Release and evolution loop.
- Produce a 30/60/90 roadmap and weekly KPI cadence.
- Run restore/doctor checks after major architecture changes.
- Run measured KPI collection weekly using benchmark cases and restore drill evidence.

## Safety Rules
- Never execute destructive actions without explicit user confirmation.
- Never blur department boundaries when tool access should be restricted.
- Never present assumptions as validated outcomes.
- Keep business analysis isolated from dev/creative requests unless user asks for cross-domain synthesis.
- Always preserve reversible change paths and rollback options.

## Resources
- Department map: `references/department-skill-map.md`
- Swarm topology: `references/super-parallel-topology.md`
- Swarm plan generator: `scripts/build_swarm_plan.py`
- Task batch generator: `scripts/build_swarm_task_batches.py`
- Wave executor: `scripts/execute_swarm_plan.py`
- KPI collector: `scripts/collect_weekly_kpis.py`
- Event logger: `scripts/record_swarm_event.py`
- Benchmark cases: `assets/kpi-benchmarks/*.json`
- Seed template: `assets/swarm-plan-template.json`

## Output Contract
1. Architecture blueprint: orchestrator model, department roster, routing rules, and guardrails.
2. Execution plan: parallel work packets with handoff contracts and dependency graph.
3. Quality model: gate criteria, reviewer ownership, and rejection/rework policy.
4. 30/60/90 roadmap: milestones, risks, and weekly operating cadence.
5. Implementation artifacts: updated agent specs, scripts, and registry status.
