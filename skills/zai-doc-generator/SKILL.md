---
id: zai-doc-generator
name: Z.ai Document Generation & Delivery
description: Generate reports and deliverables as Telegram-ready PDF, DOCX, XLSX, or text files.
type: tools
scope: general
priority: 75
contexts: [general, agency-ops, agency-marketing]
---

# Z.ai Document Generation & Delivery

## When This Skill Activates
Activate when output should be a document (report, plan, analysis, spreadsheet) delivered as a Telegram file attachment.

## Supported Output Types
| Format | Best For | Trigger Keywords |
|--------|----------|-----------------|
| PDF | Reports, briefs, presentations | "report", "brief", "document", "PDF" |
| DOCX | Editable drafts, plans | "word doc", "DOCX", "editable", "draft" |
| XLSX | Data tables, financial models | "spreadsheet", "Excel", "XLSX", "data" |
| TXT/MD | Quick exports, logs | "export", "save as", "text file" |

## Document Templates

### Status Report (YaOps)
\`\`\`
# [Project] Status Report — [Date]

## Executive Summary
[2-3 sentences]

## Progress This Period
- ✅ Completed: [items]
- 🔄 In Progress: [items]
- ⏳ Blocked: [items, with blockers]

## Metrics
[Key numbers]

## Next Actions
1. [Action] — [Owner] — [Deadline]
2. [Action] — [Owner] — [Deadline]

## Risks
[Risk] → [Mitigation]
\`\`\`

### Marketing Brief (YaMarketing)
\`\`\`
# Campaign Brief — [Name]

## Objective
## Target Audience
## Key Message
## Channels
## Content Calendar
## KPIs & Success Metrics
## Budget
## Timeline
\`\`\`

### Engineering Spec (YaDev)
\`\`\`
# Technical Spec — [Feature]

## Problem Statement
## Requirements (must/should/could)
## Proposed Solution
## Architecture Diagram (ASCII)
## Implementation Steps
## Testing Plan
## Risks & Mitigations
\`\`\`

## Delivery Protocol
1. Generate document content
2. Build document (python-docx for DOCX, reportlab for PDF)
3. Send via Telegram \`send_document\` API
4. Also paste summary in chat for immediate visibility

## File Naming Convention
\`[dept]-[type]-[YYYY-MM-DD].[ext]\`
Examples:
- \`yaops-status-report-2026-02-24.pdf\`
- \`yamarketing-campaign-brief-2026-02-24.docx\`
- \`yadev-tech-spec-auth-2026-02-24.pdf\`

## Python Libraries Available
- \`python-docx\` — DOCX creation/editing
- \`reportlab\` — PDF generation from scratch
- \`openpyxl\` — Excel/XLSX
- \`pypdf\` — PDF reading/merging
\`\`\`
