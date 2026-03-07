#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def main() -> int:
    ap = argparse.ArgumentParser(description="Append swarm telemetry event to JSONL")
    ap.add_argument("--events", required=True, help="events.jsonl path")
    ap.add_argument("--type", required=True, help="event type, e.g. incident_open, incident_resolved, restore_drill")
    ap.add_argument("--incident-id", default="", help="incident id for pairing open/resolved")
    ap.add_argument("--status", default="", help="status field")
    ap.add_argument("--details", default="", help="human-readable details")
    ap.add_argument("--metric", default="", help="metric name")
    ap.add_argument("--value", default="", help="metric value")
    args = ap.parse_args()

    event = {
        "ts": now_iso(),
        "type": args.type,
    }
    if args.incident_id:
        event["incident_id"] = args.incident_id
    if args.status:
        event["status"] = args.status
    if args.details:
        event["details"] = args.details
    if args.metric:
        event["metric"] = args.metric
    if args.value:
        try:
            event["value"] = float(args.value)
        except ValueError:
            event["value"] = args.value

    path = Path(args.events)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(event, ensure_ascii=False) + "\n")

    print(f"appended={path}")
    print(json.dumps(event, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
