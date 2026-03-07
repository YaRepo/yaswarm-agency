---
name: frontend-library-compliance-guard
description: "Detect active frontend UI libraries and enforce library-first primitive usage to prevent redundant custom components and CSS drift."
scope: global
contexts:
  - general
  - shapeshifter
  - paradox-saga
---

# Frontend Library Compliance Guard

## Overview
Use this skill to enforce UI library discipline before and during frontend implementation.

## Use This Skill When
Use when a frontend task may overlap with existing UI library primitives and you need deterministic compliance checks.
- A frontend task involves components that may already exist in project UI libraries.
- You need to prevent custom reimplementation of stable primitives.
- You need a quick audit of active UI libraries from project files.
- `$frontend-intentional-minimalism-architect` requests a library compliance check.

## Inputs
- Project root path.
- Target components/features to build.

## Workflow
1. Detect libraries and primitives:
- Run `scripts/detect_ui_library.py <project-root> --json`.
2. Decide primitive source:
- If library detected, map each required component to library primitive.
- If no relevant library, custom components are allowed.
3. Enforce constraints:
- Block custom recreation of primitives already available in library.
- Allow wrappers/styles for visual uniqueness while preserving primitive base.
4. Pre-merge review:
- Check for redundant CSS and duplicate behavior.
- Verify semantic markup and keyboard behavior remain intact.

## Safety Rules
- Do not claim a library is absent without checking project files.
- Do not force custom components when stable library primitives are present.
- Keep recommendations compatible with existing project conventions.
- If detection is ambiguous, explicitly state uncertainty and safest path.

## Resources
- Detector script: `scripts/detect_ui_library.py`

## Output Contract
1. Library detection summary.
2. Primitive mapping decision (library vs custom) for requested components.
3. Compliance risks detected.
4. Required implementation rules for the current task.
