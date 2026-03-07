---
id: zai-deep-research
name: Z.ai Deep Research Protocol
description: Multi-source research protocol with verification, synthesis, and citation requirements.
type: research
scope: general
priority: 90
contexts: [general, agency-research]
---

# Z.ai Deep Research Protocol

## When This Skill Activates
Activate for any research, investigation, fact-finding, market analysis, or "find out about X" task.

## Research Stack (in order)
1. **z.ai native web search** — real-time web results synthesized by GLM-5-Air with recency filter
2. **Brave Search API** — independent search index for cross-verification
3. **Page Reader** — auto-fetch and extract full text from top result URLs
4. **GLM-5-Thinking** — activate chain-of-thought reasoning to synthesize findings

## Research Protocol

### Step 1 — Scope Definition
Before searching, define:
- Core question (what exactly needs answering)
- Time sensitivity (is recency important?)
- Evidence type needed (statistics, opinions, facts, comparisons)

### Step 2 — Multi-Source Search
Run searches across all available tools:
- z.ai search: main query + sub-questions
- Brave: verify claims from z.ai results
- Page reader: deep-read top 2-3 URLs for full article context

### Step 3 — Synthesis & Output Structure
Deliver findings as:
\`\`\`
## Executive Summary
[2-3 sentence bottom line]

## Key Findings
- Finding 1 [source: url]
- Finding 2 [source: url]
- Finding 3 [source: url]

## Supporting Details
[Detailed breakdown with citations]

## Confidence Level
[HIGH/MEDIUM/LOW] — based on source quality and agreement across sources

## Sources
1. [Title](URL) — relevance note
2. [Title](URL) — relevance note
\`\`\`

## Critical Rules
- ALWAYS cite sources with actual URLs
- ALWAYS distinguish fact from inference
- NEVER present search results as your own knowledge
- Flag when information is older than 30 days for time-sensitive topics
- Cross-verify controversial claims with 2+ independent sources

## Thinking Mode
For complex multi-step research questions: use GLM-5-Thinking (model: glm-5-thinking) to reason through conflicting evidence and draw conclusions.
