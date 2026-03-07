# Weekly KPI Report - yamac-self-evolution

- Generated at: `2026-02-20T01:30:41.709406+00:00`
- Window days: `7`

## Metrics
- `skill_routing_accuracy`: value=1.0 (n=12, source=skill-routing-benchmark(top3-hit), target=0.98)
- `notebook_topic_routing_accuracy`: value=1.0 (n=9, source=notebook-topic-routing-benchmark, target=0.98)
- `first_pass_completion_rate`: value=1.0 (n=8, source=swarm-execution-status, target=0.9)
- `rework_rate_by_department`: value=0.0 (n=8, source=swarm-execution-status, target=0.15)
  note: uses rework_count where available; defaults to 0
- `mttr_tool_failures_hours`: value=0.0 (n=0, source=telemetry-events, target=2.0)
  note: no resolved incidents in window
- `restore_drill_pass_rate`: value=1.0 (n=1, source=live-restore-drill, target=1.0)

## Benchmarks
- Skill routing cases passed: `12/12`
- Notebook routing cases passed: `9/9`

## Restore Drill
- Result: `pass`
- Details: restored /var/folders/kd/q_xdqfws1hl5fl65bg0q8hcm0000gp/T/yamac-restore-drill-_ap1otzr/memory/memory.sqlite

## Observability
- OTLP enabled: `True`
- OTLP endpoint: `http://127.0.0.1:4318/v1/traces`
