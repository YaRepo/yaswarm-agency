#!/usr/bin/env python3
import argparse
import fcntl
import json
import os
import subprocess
from dataclasses import dataclass, asdict
from contextlib import contextmanager
from datetime import datetime, UTC
from pathlib import Path
from typing import Dict, List
from uuid import uuid4

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog"
AGENCY_FILE = CATALOG / "agency-structure.json"
STATE_FILE = CATALOG / "swarm-state.json"
TELEGRAM_MAP_FILE = CATALOG / "telegram-thread-map.json"
STATE_LOCK_FILE = CATALOG / "swarm-state.lock"


def now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


@dataclass
class Task:
    id: str
    department: str
    subagent: str
    title: str
    status: str
    created_at: str
    updated_at: str


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text())


def save_json(path: Path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp.write_text(json.dumps(data, indent=2))
    tmp.replace(path)


@contextmanager
def state_lock(exclusive: bool = True):
    CATALOG.mkdir(parents=True, exist_ok=True)
    with STATE_LOCK_FILE.open("a+", encoding="utf-8") as fh:
        fcntl.flock(fh.fileno(), fcntl.LOCK_EX if exclusive else fcntl.LOCK_SH)
        try:
            yield
        finally:
            fcntl.flock(fh.fileno(), fcntl.LOCK_UN)


def post_event(event: str, task_id: str = ""):
    hook = ROOT / "scripts" / "swarm-post-event.sh"
    if hook.exists():
        try:
            subprocess.run([str(hook), event, task_id], check=False)
        except Exception:
            pass


def init_state():
    agency = load_json(AGENCY_FILE, None)
    if not agency:
        raise SystemExit("Agency structure missing. Run onboarding first.")

    with state_lock(exclusive=True):
        state = {
            "version": "1.0.0",
            "updated_at": now_iso(),
            "ceo": agency.get("ceo", "yaswarm"),
            "departments": {
                d["name"]: {
                    "head": d.get("head"),
                    "subagents": d.get("subagents", []),
                    "queue": [],
                    "active": [],
                    "done": []
                }
                for d in agency.get("departments", [])
            }
        }
        save_json(STATE_FILE, state)

        if agency.get("telegram_threads_enabled", False):
            mapping = {
                "version": "1.0.0",
                "updated_at": now_iso(),
                "threads": {
                    d["name"]: {
                        "topic": f"dept-{d['name']}",
                        "thread_id": None,
                        "head": d.get("head")
                    }
                    for d in agency.get("departments", [])
                }
            }
            save_json(TELEGRAM_MAP_FILE, mapping)

    print(f"Initialized swarm state: {STATE_FILE}")
    post_event("init", "")


def dispatch_task(department: str, title: str):
    with state_lock(exclusive=True):
        state = load_json(STATE_FILE, None)
        if not state:
            raise SystemExit("Swarm state missing. Run swarm init.")
        if department not in state["departments"]:
            raise SystemExit(f"Unknown department: {department}")

        dept = state["departments"][department]
        subagents = dept.get("subagents", [])
        if not subagents:
            raise SystemExit(f"No subagents for department: {department}")

        active = dept.get("active", [])
        assigned = subagents[len(active) % len(subagents)]

        task_id = f"{department}-{int(datetime.now(UTC).timestamp() * 1000)}-{uuid4().hex[:8]}"
        t = Task(
            id=task_id,
            department=department,
            subagent=assigned,
            title=title,
            status="active",
            created_at=now_iso(),
            updated_at=now_iso(),
        )
        dept["active"].append(asdict(t))
        state["updated_at"] = now_iso()
        save_json(STATE_FILE, state)
    print(json.dumps(asdict(t), indent=2))
    post_event("dispatch", task_id)


def complete_task(task_id: str):
    with state_lock(exclusive=True):
        state = load_json(STATE_FILE, None)
        if not state:
            raise SystemExit("Swarm state missing. Run swarm init.")

        found = None
        for name, dept in state["departments"].items():
            for i, t in enumerate(dept.get("active", [])):
                if t["id"] == task_id:
                    found = (name, i, t)
                    break
            if found:
                break

        if not found:
            raise SystemExit(f"Task not found: {task_id}")

        dept_name, idx, t = found
        t["status"] = "done"
        t["updated_at"] = now_iso()
        state["departments"][dept_name]["active"].pop(idx)
        state["departments"][dept_name]["done"].append(t)
        state["updated_at"] = now_iso()
        save_json(STATE_FILE, state)
    print(json.dumps(t, indent=2))
    post_event("complete", task_id)


def status():
    with state_lock(exclusive=False):
        state = load_json(STATE_FILE, None)
        if not state:
            raise SystemExit("Swarm state missing. Run swarm init.")

    summary = {
        "updated_at": state.get("updated_at"),
        "departments": {}
    }
    for name, dept in state["departments"].items():
        summary["departments"][name] = {
            "head": dept.get("head"),
            "subagents": len(dept.get("subagents", [])),
            "active": len(dept.get("active", [])),
            "done": len(dept.get("done", [])),
            "queue": len(dept.get("queue", [])),
        }
    print(json.dumps(summary, indent=2))


def main():
    p = argparse.ArgumentParser(description="YaSwarm runtime")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init")

    d = sub.add_parser("dispatch")
    d.add_argument("department")
    d.add_argument("title")

    c = sub.add_parser("complete")
    c.add_argument("task_id")

    sub.add_parser("status")

    args = p.parse_args()

    if args.cmd == "init":
        init_state()
    elif args.cmd == "dispatch":
        dispatch_task(args.department, args.title)
    elif args.cmd == "complete":
        complete_task(args.task_id)
    elif args.cmd == "status":
        status()


if __name__ == "__main__":
    main()
