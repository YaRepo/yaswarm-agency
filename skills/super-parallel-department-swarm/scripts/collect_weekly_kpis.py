#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import tempfile
from contextlib import nullcontext
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path


@dataclass
class Metric:
    value: float
    sample_size: int
    source: str
    note: str = ""

    def as_dict(self, target: float | None = None) -> dict:
        out = {
            "value": round(self.value, 4),
            "sample_size": self.sample_size,
            "source": self.source,
        }
        if target is not None:
            out["target"] = target
            out["gap"] = round(target - self.value, 4)
        if self.note:
            out["note"] = self.note
        return out


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def parse_iso(ts: str) -> datetime:
    return datetime.fromisoformat(ts.replace("Z", "+00:00"))


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def append_event(events_path: Path, payload: dict) -> None:
    events_path.parent.mkdir(parents=True, exist_ok=True)
    with events_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(payload, ensure_ascii=False) + "\n")


def load_events(events_path: Path) -> list[dict]:
    if not events_path.exists():
        return []
    rows = []
    for line in events_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def init_otlp_tracer(endpoint: str, service_name: str):
    if not endpoint:
        return None, None, ""
    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
    except Exception as exc:
        return None, None, f"OTLP disabled: {exc}"

    provider = TracerProvider(resource=Resource.create({"service.name": service_name}))
    exporter = OTLPSpanExporter(endpoint=endpoint)
    processor = BatchSpanProcessor(exporter)
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
    tracer = trace.get_tracer(service_name)
    return tracer, provider, ""


def run_orchestrate(orchestrate_script: Path, registry: Path, task: str, cwd: str = "") -> dict:
    cmd = [
        "python3",
        str(orchestrate_script),
        "--registry",
        str(registry),
        "--task",
        task,
        "--cwd",
        cwd,
        "--json",
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"orchestrate_task failed: {p.stderr.strip() or p.stdout.strip()}")
    return json.loads(p.stdout)


def measure_skill_routing(cases: list[dict], orchestrate_script: Path, registry: Path) -> tuple[Metric, list[dict]]:
    if not cases:
        return Metric(0.0, 0, "skill-routing-benchmark", "no cases"), []

    passed = 0
    details = []
    for c in cases:
        result = run_orchestrate(orchestrate_script, registry, c["task"], c.get("cwd", ""))
        chain_ids = [x["skill_id"] for x in result.get("execution_chain", [])]
        top3 = chain_ids[:3]
        ok = c["expected_skill"] in top3
        if ok:
            passed += 1
        details.append(
            {
                "id": c.get("id"),
                "expected_skill": c["expected_skill"],
                "top3": top3,
                "pass": ok,
            }
        )

    return Metric(passed / len(cases), len(cases), "skill-routing-benchmark(top3-hit)"), details


def topic_keywords() -> dict[str, set[str]]:
    return {
        "coding-dev": {"code", "coding", "agent", "agentic", "framework", "orchestration", "automation", "mcp", "dev", "system"},
        "backend": {"backend", "api", "server", "service", "database", "runtime", "reliability"},
        "writing-fiction": {"novel", "fiction", "chapter", "character", "plot", "scene", "manuscript"},
        "writing-nonfiction": {"nonfiction", "research", "article", "essay", "evidence", "brief"},
        "art-design": {"design", "visual", "art", "typography", "layout", "brand"},
        "books-publishing": {"book", "publishing", "launch", "metadata", "author"},
        "film-production": {"film", "cinema", "shot", "treatment", "screenplay", "production"},
        "marketing": {"marketing", "campaign", "channel", "ads", "messaging", "audience"},
        "business": {"business", "monetization", "pricing", "gtm", "kpi", "revenue", "offer"},
    }


def classify_topic(task: str) -> str:
    toks = set(re.findall(r"[a-z0-9]+", task.lower()))
    best_topic = "coding-dev"
    best_score = -1
    for topic, words in topic_keywords().items():
        score = len(toks & words)
        if score > best_score:
            best_score = score
            best_topic = topic
    return best_topic


def measure_notebook_routing(cases: list[dict]) -> tuple[Metric, list[dict]]:
    if not cases:
        return Metric(0.0, 0, "notebook-topic-benchmark", "no cases"), []

    passed = 0
    details = []
    for c in cases:
        predicted = classify_topic(c["task"])
        ok = predicted == c["expected_topic"]
        if ok:
            passed += 1
        details.append(
            {
                "id": c.get("id"),
                "expected_topic": c["expected_topic"],
                "predicted_topic": predicted,
                "pass": ok,
            }
        )

    return Metric(passed / len(cases), len(cases), "notebook-topic-routing-benchmark"), details


def measure_execution_metrics(execution_status: dict, task_batches: dict) -> tuple[Metric, Metric]:
    total_depts = 0
    for wave in task_batches.get("waves", []):
        total_depts += len(wave.get("departments", []))

    completed = int(execution_status.get("departments_completed", 0))
    first_pass = Metric((completed / total_depts) if total_depts else 0.0, total_depts, "swarm-execution-status")

    total_rework = 0
    waves = execution_status.get("wave_results", [])
    for wr in waves:
        total_rework += int(wr.get("rework_count", 0))
    rework = Metric((total_rework / total_depts) if total_depts else 0.0, total_depts, "swarm-execution-status", "uses rework_count where available; defaults to 0")
    return first_pass, rework


def measure_mttr(events: list[dict], window_days: int) -> tuple[Metric, int]:
    since = now_utc() - timedelta(days=window_days)

    open_by_id: dict[str, datetime] = {}
    durations: list[float] = []

    for e in events:
        ts = e.get("ts")
        if not ts:
            continue
        try:
            t = parse_iso(ts)
        except Exception:
            continue
        if t < since:
            continue

        et = e.get("type")
        inc = e.get("incident_id")
        if not inc:
            continue

        if et == "incident_open":
            open_by_id[inc] = t
        elif et == "incident_resolved" and inc in open_by_id:
            dt = (t - open_by_id[inc]).total_seconds() / 3600.0
            if dt >= 0:
                durations.append(dt)
            del open_by_id[inc]

    if not durations:
        return Metric(0.0, 0, "telemetry-events", "no resolved incidents in window"), 0

    avg = sum(durations) / len(durations)
    return Metric(avg, len(durations), "telemetry-events"), len(durations)


def verify_backups(backup_dir: Path, window_days: int) -> tuple[int, int]:
    since = now_utc() - timedelta(days=window_days)
    total = 0
    passed = 0

    for enc in sorted(backup_dir.glob("yamac-state-*.tar.enc")):
        try:
            mtime = datetime.fromtimestamp(enc.stat().st_mtime, tz=timezone.utc)
        except Exception:
            continue
        if mtime < since:
            continue

        total += 1
        sha_path = enc.with_suffix("").with_suffix(".sha256")
        if not sha_path.exists():
            continue

        expected = sha_path.read_text(encoding="utf-8").split()[0].strip()
        p = subprocess.run(["shasum", "-a", "256", str(enc)], capture_output=True, text=True)
        if p.returncode != 0:
            continue
        actual = p.stdout.split()[0].strip()
        if expected and actual == expected:
            passed += 1

    return passed, total


def run_restore_drill(restore_script: Path, backup_dir: Path, keychain_service: str) -> tuple[bool, str]:
    backups = sorted(backup_dir.glob("yamac-state-*.tar.enc"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not backups:
        return False, "no backup file available"

    latest = backups[0]
    passphrase = os.environ.get("YAMAC_BACKUP_PASSPHRASE", "")
    if not passphrase:
        p = subprocess.run([
            "security",
            "find-generic-password",
            "-s",
            keychain_service,
            "-w",
        ], capture_output=True, text=True)
        if p.returncode == 0:
            passphrase = p.stdout.strip()

    if not passphrase:
        return False, "backup passphrase unavailable"

    target = Path(tempfile.mkdtemp(prefix="yamac-restore-drill-"))
    env = os.environ.copy()
    env["YAMAC_BACKUP_PASSPHRASE"] = passphrase

    try:
        p = subprocess.run(
            [
                str(restore_script),
                "--target-root",
                str(target),
                "--backup-dir",
                str(backup_dir),
                "--file",
                str(latest),
            ],
            capture_output=True,
            text=True,
            env=env,
        )
        if p.returncode != 0:
            return False, (p.stderr.strip() or p.stdout.strip() or "restore script failed")

        sqlite_file = target / "memory" / "memory.sqlite"
        if not sqlite_file.exists():
            return False, "restore output missing memory.sqlite"
        return True, f"restored {sqlite_file}"
    finally:
        shutil.rmtree(target, ignore_errors=True)


def render_markdown(report: dict) -> str:
    m = report["metrics"]
    lines = [
        f"# Weekly KPI Report - {report['project']}",
        "",
        f"- Generated at: `{report['generated_at']}`",
        f"- Window days: `{report['window_days']}`",
        "",
        "## Metrics",
    ]

    for k in [
        "skill_routing_accuracy",
        "notebook_topic_routing_accuracy",
        "first_pass_completion_rate",
        "rework_rate_by_department",
        "mttr_tool_failures_hours",
        "restore_drill_pass_rate",
    ]:
        row = m[k]
        target = row.get("target")
        tgt = f", target={target}" if target is not None else ""
        lines.append(
            f"- `{k}`: value={row['value']} (n={row['sample_size']}, source={row['source']}{tgt})"
        )
        if row.get("note"):
            lines.append(f"  note: {row['note']}")

    lines.extend([
        "",
        "## Benchmarks",
        f"- Skill routing cases passed: `{report['benchmarks']['skill_routing']['passed']}/{report['benchmarks']['skill_routing']['total']}`",
        f"- Notebook routing cases passed: `{report['benchmarks']['notebook_routing']['passed']}/{report['benchmarks']['notebook_routing']['total']}`",
        "",
        "## Restore Drill",
        f"- Result: `{report['restore_drill']['status']}`",
        f"- Details: {report['restore_drill']['details']}",
        "",
        "## Observability",
        f"- OTLP enabled: `{report.get('observability', {}).get('otlp_enabled', False)}`",
        f"- OTLP endpoint: `{report.get('observability', {}).get('otlp_endpoint', '') or 'not-set'}`",
    ])
    warning = report.get("observability", {}).get("warning", "")
    if warning:
        lines.append(f"- Warning: {warning}")
    lines.append("")

    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description="Collect weekly measured KPIs for swarm/system quality")
    ap.add_argument("--plan-dir", required=True)
    ap.add_argument("--registry", default=str(Path.home() / ".codex" / "skill-system" / "registry" / "skills-registry.json"))
    ap.add_argument("--orchestrate-script", default=str(Path.home() / ".codex" / "skill-system" / "scripts" / "orchestrate_task.py"))
    ap.add_argument("--skill-cases", default=str(Path.home() / ".codex" / "skills" / "super-parallel-department-swarm" / "assets" / "kpi-benchmarks" / "skill-routing-cases.json"))
    ap.add_argument("--notebook-cases", default=str(Path.home() / ".codex" / "skills" / "super-parallel-department-swarm" / "assets" / "kpi-benchmarks" / "notebook-routing-cases.json"))
    ap.add_argument("--events", default=str(Path.home() / ".codex" / "skills" / "super-parallel-department-swarm" / "assets" / "telemetry" / "events.jsonl"))
    ap.add_argument("--backup-dir", default=str(Path.home() / "yamac-core" / "state-backups"))
    ap.add_argument("--restore-script", default=str(Path.home() / "yamac-core" / "scripts" / "restore_state.sh"))
    ap.add_argument("--keychain-service", default="yamac-state-backup-passphrase")
    ap.add_argument("--window-days", type=int, default=7)
    ap.add_argument("--run-restore-drill", action="store_true")
    ap.add_argument("--out-json", default="")
    ap.add_argument("--out-md", default="")
    ap.add_argument("--otel-endpoint", default=os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", ""))
    ap.add_argument("--otel-service-name", default=os.environ.get("OTEL_SERVICE_NAME", "yamac-swarm-kpi"))
    args = ap.parse_args()

    plan_dir = Path(args.plan_dir)
    plan = load_json(plan_dir / "swarm-plan.json", {})
    execution_status = load_json(plan_dir / "execution-status.json", {})
    task_batches = load_json(plan_dir / "task-batches.json", {})
    baseline = load_json(plan_dir / "kpi-baseline.json", {"metrics": {}}).get("metrics", {})

    skill_cases = load_json(Path(args.skill_cases), [])
    notebook_cases = load_json(Path(args.notebook_cases), [])

    tracer, tracer_provider, otel_warning = init_otlp_tracer(args.otel_endpoint, args.otel_service_name)
    span_ctx = tracer.start_as_current_span if tracer else None

    with (span_ctx("measure_skill_routing") if span_ctx else nullcontext()) as span:
        skill_metric, skill_details = measure_skill_routing(skill_cases, Path(args.orchestrate_script), Path(args.registry))
        if span:
            span.set_attribute("cases.total", len(skill_cases))
            span.set_attribute("metric.value", float(skill_metric.value))

    with (span_ctx("measure_notebook_routing") if span_ctx else nullcontext()) as span:
        notebook_metric, notebook_details = measure_notebook_routing(notebook_cases)
        if span:
            span.set_attribute("cases.total", len(notebook_cases))
            span.set_attribute("metric.value", float(notebook_metric.value))

    with (span_ctx("measure_execution_metrics") if span_ctx else nullcontext()) as span:
        first_pass_metric, rework_metric = measure_execution_metrics(execution_status, task_batches)
        if span:
            span.set_attribute("first_pass.value", float(first_pass_metric.value))
            span.set_attribute("rework.value", float(rework_metric.value))

    events_path = Path(args.events)
    with (span_ctx("measure_mttr") if span_ctx else nullcontext()) as span:
        events = load_events(events_path)
        mttr_metric, mttr_samples = measure_mttr(events, args.window_days)
        if span:
            span.set_attribute("incidents.resolved", int(mttr_samples))
            span.set_attribute("metric.hours", float(mttr_metric.value))

    with (span_ctx("verify_backups") if span_ctx else nullcontext()) as span:
        backups_passed, backups_total = verify_backups(Path(args.backup_dir), args.window_days)
        if span:
            span.set_attribute("backups.checked", int(backups_total))
            span.set_attribute("backups.passed", int(backups_passed))

    restore_status = {"status": "skipped", "details": "restore drill not requested"}
    restore_rate_val = 0.0
    restore_samples = backups_total
    if args.run_restore_drill:
        with (span_ctx("run_restore_drill") if span_ctx else nullcontext()) as span:
            ok, details = run_restore_drill(Path(args.restore_script), Path(args.backup_dir), args.keychain_service)
            if span:
                span.set_attribute("restore.status", "pass" if ok else "fail")
        restore_status = {"status": "pass" if ok else "fail", "details": details}
        restore_rate_val = 1.0 if ok else 0.0
        restore_samples = 1
        append_event(
            events_path,
            {
                "ts": now_utc().isoformat(),
                "type": "restore_drill",
                "status": restore_status["status"],
                "details": details,
            },
        )
    elif backups_total > 0:
        restore_rate_val = backups_passed / backups_total

    restore_metric = Metric(
        restore_rate_val,
        restore_samples,
        "live-restore-drill" if args.run_restore_drill else "backup-checksum-verification",
        "checksum-based fallback used" if not args.run_restore_drill else "",
    )

    def target(name: str) -> float | None:
        t = baseline.get(name, {}).get("target")
        return float(t) if isinstance(t, (int, float)) else None

    report = {
        "project": plan.get("project", "yamac-self-evolution"),
        "generated_at": now_utc().isoformat(),
        "window_days": args.window_days,
        "metrics": {
            "skill_routing_accuracy": skill_metric.as_dict(target("skill_routing_accuracy")),
            "notebook_topic_routing_accuracy": notebook_metric.as_dict(target("notebook_topic_routing_accuracy")),
            "first_pass_completion_rate": first_pass_metric.as_dict(target("first_pass_completion_rate")),
            "rework_rate_by_department": rework_metric.as_dict(target("rework_rate_by_department")),
            "mttr_tool_failures_hours": mttr_metric.as_dict(target("mttr_tool_failures_hours")),
            "restore_drill_pass_rate": restore_metric.as_dict(target("restore_drill_pass_rate")),
        },
        "benchmarks": {
            "skill_routing": {
                "total": len(skill_details),
                "passed": sum(1 for d in skill_details if d["pass"]),
                "details": skill_details,
            },
            "notebook_routing": {
                "total": len(notebook_details),
                "passed": sum(1 for d in notebook_details if d["pass"]),
                "details": notebook_details,
            },
        },
        "restore_drill": restore_status,
        "backup_integrity": {
            "checked": backups_total,
            "passed": backups_passed,
        },
        "incident_samples": mttr_samples,
        "observability": {
            "otlp_enabled": bool(tracer),
            "otlp_endpoint": args.otel_endpoint if args.otel_endpoint else "",
            "warning": otel_warning,
        },
    }

    out_json = Path(args.out_json) if args.out_json else plan_dir / "kpi-weekly-measured.json"
    out_md = Path(args.out_md) if args.out_md else plan_dir / "kpi-weekly-measured.md"

    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_json.write_text(json.dumps(report, indent=2), encoding="utf-8")
    out_md.write_text(render_markdown(report), encoding="utf-8")

    if tracer_provider and hasattr(tracer_provider, "force_flush"):
        tracer_provider.force_flush()

    print(f"json={out_json}")
    print(f"markdown={out_md}")
    print(f"skill_routing_accuracy={report['metrics']['skill_routing_accuracy']['value']}")
    print(f"notebook_topic_routing_accuracy={report['metrics']['notebook_topic_routing_accuracy']['value']}")
    print(f"restore_drill={restore_status['status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
