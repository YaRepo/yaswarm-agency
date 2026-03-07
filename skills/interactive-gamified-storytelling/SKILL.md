---
name: interactive-gamified-storytelling
description: Design and script interactive gamified storytelling experiences with branching narrative logic, player choices, progression systems, and replay loops. Use when the user asks to create choice-driven story scripts, quest flows, dialogue trees, or narrative game prototypes for original IP.
---

# Interactive Gamified Storytelling

## Overview
Use this skill to convert story ideas into playable interactive scripts with clear branching, progression, and consequence systems.

## Workflow
1. Narrative core.
- Define premise, player role, objective, and emotional arc.
- Set interaction model: dialogue choices, quest choices, or scene actions.

2. System design.
- Define variables: trust, fear, reputation, inventory, flags.
- Define progression: chapters, quests, levels, endings.

3. Branch scripting.
- Write nodes with choices, conditions, and outcomes.
- Ensure each branch changes state or reveals meaningful information.

4. Replay and balance.
- Add alternate paths, fail-forward states, and recovery branches.
- Prevent dead ends unless intentionally used.

5. Production outputs.
- Export story graph, script package, and test checklist.

## Safety Rules
- Keep continuity constraints explicit (timeline, character state, world rules).
- Label unresolved branches as pending-work items.
- Keep player-facing text separate from dev notes.

## Resources
- Narrative state model: `references/state-model.md`
- Branch quality checklist: `references/branch-checklist.md`
- Story graph scaffold: `scripts/scaffold_story_graph.py`
- Graph validator: `scripts/validate_story_graph.py`

## Output Contract
1. Node graph summary
2. Player variables and progression rules
3. Branch gaps or unreachable nodes
4. Next writing/testing tasks
