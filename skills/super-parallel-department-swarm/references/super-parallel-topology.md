# Super Parallel Topology

## Layers
1. Orchestrator Layer
- Intake, decomposition, routing, conflict resolution, final merge.

2. Department Layer
- Eight specialist departments operating in parallel under explicit tool ownership.

3. QA and Memory Layer
- Quality gates at merge points.
- Decision logging to daily memory and SQLite index.

## Handoff contract
Each packet must include:
- owner department
- objective
- required inputs
- output schema
- acceptance criteria
- blockers and escalation path

## Quality gates
- Technical correctness
- UX/visual coherence
- Narrative or communication clarity
- Strategic fit and risk controls
