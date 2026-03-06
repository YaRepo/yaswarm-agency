#!/usr/bin/env python3
import json
from datetime import datetime, UTC
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "catalog"
MCP_DIR = ROOT / "mcp"
PROJECTS = ROOT / "projects"
OUT_DIR = PROJECTS / "dashboard-agency" / "data"
OUT_FILE = OUT_DIR / "overview.json"


def now_iso():
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text())


def count_skills():
    # prefer explicit catalog if present
    cat = load_json(CATALOG / "skills.json", None)
    if cat and isinstance(cat.get("skills"), list):
        return len(cat["skills"])
    skills_dir = ROOT / "skills"
    if skills_dir.exists():
        return len([p for p in skills_dir.iterdir() if p.is_dir()])
    return 0


def count_mcp_servers():
    cfg = load_json(MCP_DIR / "mcp-config.json", None)
    if not cfg:
        cfg = load_json(MCP_DIR / "mcp-config.example.json", {"servers": []})
    servers = cfg.get("servers", [])
    if isinstance(servers, list):
        return len(servers)
    if isinstance(servers, dict):
        return len(servers.keys())
    return 0


def load_swarm_status():
    state = load_json(CATALOG / "swarm-state.json", None)
    if not state:
        return {"initialized": False, "departments": 0, "active_tasks": 0}

    depts = state.get("departments", {})
    active = sum(len(v.get("active", [])) for v in depts.values())
    return {
        "initialized": True,
        "departments": len(depts),
        "active_tasks": active,
    }


def load_repo_catalog_summary():
    rc = load_json(CATALOG / "repo-catalog.json", {"projects": []})
    projects = rc.get("projects", []) if isinstance(rc.get("projects"), list) else []
    return {
        "count": len(projects),
        "projects": projects,
    }


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    payload = {
        "version": "1.0.0",
        "generated_at": now_iso(),
        "summary": {
            "skills": count_skills(),
            "mcp_servers": count_mcp_servers(),
            "swarm": load_swarm_status(),
            "repo_catalog": load_repo_catalog_summary(),
        },
        "paths": {
            "root": str(ROOT),
            "catalog": str(CATALOG),
            "mcp": str(MCP_DIR),
            "projects": str(PROJECTS),
        },
    }

    OUT_FILE.write_text(json.dumps(payload, indent=2))
    print(str(OUT_FILE))


if __name__ == "__main__":
    main()
