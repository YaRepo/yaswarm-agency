---
name: creator-finance-ops
description: Manage creator cashflow operations by tracking project income/expenses, invoice status, subscriptions, and monthly close snapshots. Use when the user asks for finance cleanup, budget tracking, or payment follow-up planning.
---

# Creator Finance Ops

## Overview
Use this skill to run a lightweight finance operating system for creative work.

## Workflow
1. Intake transactions and obligations.
2. Classify income/expense and project mapping.
3. Track invoice lifecycle: draft, sent, due, paid, overdue.
4. Generate monthly close summary and alerts.

## Safety Rules
- Mark unknown amounts and dates explicitly.
- Keep tax/legal language as draft unless verified.
- Never remove historical entries automatically.

## Resources
- Ledger schema: `references/ledger-schema.md`
- Snapshot script: `scripts/monthly_snapshot.py`

## Output Contract
1. Cashflow snapshot
2. Invoice follow-up queue
3. Subscription/repeating cost list
4. Risks and missing data
