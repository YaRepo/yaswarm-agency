---
id: zai-semantic-reasoning
name: Z.ai Thinking Mode & Semantic Reasoning
description: Apply structured high-reasoning workflows for complex debugging, analysis, and decisions.
type: reasoning
scope: general
priority: 80
contexts: [general, agency-engineering, agency-research]
---

# Z.ai Thinking Mode & Semantic Reasoning

## When This Skill Activates
Activate for: complex logic, debugging hard bugs, multi-step math, architecture decisions, strategic planning, contradictory evidence analysis.

## Thinking Mode (GLM-5-Thinking)
Use model: \`glm-5-thinking\` or pass \`reasoning_effort: high\` to enable chain-of-thought.

### When to Enable Thinking
- Enable for: multi-step debugging (tracing through execution paths)
- Algorithm design and complexity analysis
- Conflicting requirements → trade-off analysis
- Math/statistical problems
- Architecture decisions with multiple valid approaches

### When to Disable Thinking
- Simple Q&A, lookups, factual questions
- Creative writing and content generation
- Formatting/summarization tasks

## Reasoning Protocol

### Step 1 — Problem Decomposition
Break problem into atomic sub-problems before solving anything.

### Step 2 — Hypothesis Generation
Generate 2-3 candidate solutions/explanations before committing.

### Step 3 — Evidence Evaluation
For each hypothesis: what evidence supports it? What contradicts it?

### Step 4 — Synthesis
Choose best solution with explicit reasoning. State confidence level.

### Step 5 — Verification
Where possible, verify answer by working backwards or testing a related case.

## For Engineering (YaDev)
- Use thinking mode for: architecture decisions, performance bottlenecks, security audits
- Disable for: formatting code, writing docs, simple CRUD
- Always show: what you're doing, why, what could go wrong

## For Research (YaResearch)
- Use thinking mode for: synthesizing contradictory research, causal analysis
- Structure reasoning as: evidence → inference → conclusion → confidence
- Never skip source citation in reasoning chain

## Output Format for Reasoning Tasks
\`\`\`
## Analysis
[Chain-of-thought reasoning, visible to user]

## Conclusion
[Final answer, direct and actionable]

## Confidence
[HIGH/MEDIUM/LOW] — [brief justification]

## Caveats
[What might make this wrong]
\`\`\`
