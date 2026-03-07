#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STRUCTURE_FILE="$ROOT/catalog/agency-structure.json"

if [[ ! -f "$STRUCTURE_FILE" ]]; then
  echo "Missing agency structure file: $STRUCTURE_FILE" >&2
  exit 1
fi

declare -a roots=()
for p in \
  "$ROOT/projects/yaswarm-desk-workspace/agency"
do
  [[ -d "$p" ]] || continue
  skip=0
  for r in "${roots[@]:-}"; do
    [[ "$r" == "$p" ]] && skip=1 && break
  done
  [[ "$skip" == "1" ]] || roots+=("$p")
done

if [[ "${#roots[@]}" -eq 0 ]]; then
  echo "No agency roots found to sync." >&2
  exit 1
fi

python3 - "$STRUCTURE_FILE" "${roots[@]}" <<'PY'
import json
import re
import sys
from datetime import datetime, UTC
from pathlib import Path

structure_path = Path(sys.argv[1])
agency_roots = [Path(p) for p in sys.argv[2:]]

structure = json.loads(structure_path.read_text(encoding="utf-8"))
departments = structure.get("departments", [])
if not departments:
    raise SystemExit("No departments found in agency-structure.json")

now = datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")

def slug_key(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.strip().lower()).strip("_")

def title(name: str) -> str:
    return " ".join(word.capitalize() for word in re.split(r"[-_\\s]+", name.strip()) if word)

def default_keywords(name: str):
    words = [w for w in re.split(r"[-_\\s]+", name.lower()) if w]
    extra = {
        "research": ["analysis", "insight", "benchmark", "fact"],
        "product": ["roadmap", "requirements", "spec", "feature"],
        "operations": ["runbook", "incident", "sop", "process"],
        "marketing": ["campaign", "audience", "positioning", "brand"],
        "development": ["script", "screenplay", "storyline", "concept"],
        "production": ["shoot", "schedule", "crew", "set"],
        "post": ["edit", "color", "mix", "master"],
        "security": ["risk", "compliance", "threat", "audit"],
    }
    k = set(words)
    joined = "-".join(words)
    for key, vals in extra.items():
        if key in joined:
            k.update(vals)
    return sorted(k)

def ensure_workspace(root: Path, dep_name: str):
    dep_dir = root / "agents" / "departments" / dep_name
    dep_dir.mkdir(parents=True, exist_ok=True)
    base = f"# {dep_name}\\n\\nAuto-generated department workspace for YaSwarm."
    files = {
        "AGENTS.md": base,
        "MEMORY.md": f"# {dep_name} Memory\\n",
        "SOUL.md": f"# {dep_name} Soul\\n",
        "TOOLS.md": f"# {dep_name} Tools\\n",
        "USER.md": f"# {dep_name} User\\n",
    }
    for fn, content in files.items():
        p = dep_dir / fn
        if not p.exists():
            p.write_text(content, encoding="utf-8")

for agency_root in agency_roots:
    config_dir = agency_root / "config"
    config_dir.mkdir(parents=True, exist_ok=True)

    agency_config_path = config_dir / "agency-config.json"
    existing = {}
    if agency_config_path.exists():
        existing = json.loads(agency_config_path.read_text(encoding="utf-8"))

    existing_deps = existing.get("departments", {}) if isinstance(existing.get("departments"), dict) else {}
    existing_keywords = (((existing.get("routing_rules") or {}).get("keywords")) or {})

    ceo = existing.get("ceo", {})
    ceo.setdefault("bot_id", "yaswarm_bot")
    ceo.setdefault("bot_name", "YaSwarm CEO")
    ceo.setdefault("token_env", "YASWARM_CEO_BOT_TOKEN")
    ceo.setdefault("role", "orchestrator")
    ceo["departments"] = [d["name"] for d in departments]

    new_deps = {}
    new_keywords = {}
    for dep in departments:
        name = dep["name"]
        key = slug_key(name).upper()
        dep_obj = existing_deps.get(name, {})
        bot_id = dep_obj.get("bot_id", f"yaswarm_{slug_key(name)}_bot")
        bot_name = dep_obj.get("bot_name", f"YaSwarm {title(name)}")
        dep_obj.update({
            "bot_id": bot_id,
            "bot_name": bot_name,
            "token_env": dep_obj.get("token_env", f"YASWARM_{key}_BOT_TOKEN"),
            "role": dep_obj.get("role", f"{title(name)} Lead"),
            "department": dep_obj.get("department", title(name)),
            "topic_name": dep_obj.get("topic_name", f"{title(name)} — {bot_name}"),
            "topic_thread_id": dep_obj.get("topic_thread_id", None),
            "system_context": dep_obj.get(
                "system_context",
                f"You are {bot_name}, lead for {title(name)}. Execute tasks and report clearly to CEO."
            ),
            "skills": dep_obj.get("skills", []),
            "backend": dep_obj.get("backend", "opencode"),
            "model_tier": dep_obj.get("model_tier", "medium"),
            "can_spawn_subagents": dep_obj.get("can_spawn_subagents", True),
            "backend_chain": dep_obj.get("backend_chain", ["opencode", "glm"]),
        })
        new_deps[name] = dep_obj
        new_keywords[name] = existing_keywords.get(name) or default_keywords(name)
        ensure_workspace(agency_root, name)

    new_agency = existing
    new_agency["description"] = existing.get("description", "YaSwarm Agency configuration")
    new_agency["ceo"] = ceo
    new_agency["departments"] = new_deps
    rr = new_agency.get("routing_rules", {})
    rr["keywords"] = new_keywords
    rr["default_department"] = departments[0]["name"]
    new_agency["routing_rules"] = rr
    new_agency["updated_at"] = now
    agency_config_path.write_text(json.dumps(new_agency, indent=2) + "\n", encoding="utf-8")

    # department-sub-agents.json
    dsa_path = config_dir / "department-sub-agents.json"
    dsa = {"description": "YaSwarm department sub-agent definitions", "departments": {}}
    if dsa_path.exists():
        try:
            dsa = json.loads(dsa_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    dsa_deps = dsa.get("departments", {}) if isinstance(dsa.get("departments"), dict) else {}
    for dep in departments:
        name = dep["name"]
        dep_entry = dsa_deps.get(name, {})
        dep_entry.setdefault("name", title(name))
        dep_entry.setdefault("role", f"{title(name)} Lead")
        sub_agents = dep_entry.get("sub_agents", {})
        if not isinstance(sub_agents, dict):
            sub_agents = {}
        for sub in dep.get("subagents", []):
            suffix = sub.replace(f"{name}-", "", 1)
            category = "quick" if "qa" in suffix else "reasoning"
            sub_agents.setdefault(suffix, {
                "name": f"{title(suffix)} Agent",
                "description": f"{title(suffix)} specialist for {title(name)}",
                "category": category,
                "model": "GLM-4.7",
                "fallback_chain": ["GLM-4.7"],
            })
        dep_entry["sub_agents"] = sub_agents
        dsa_deps[name] = dep_entry
    dsa["departments"] = dsa_deps
    dsa_path.write_text(json.dumps(dsa, indent=2) + "\n", encoding="utf-8")

    # agency-bot-config.json
    abc_path = config_dir / "agency-bot-config.json"
    abc = {"description": "Per-bot runtime configuration", "bots": {}}
    if abc_path.exists():
        try:
            abc = json.loads(abc_path.read_text(encoding="utf-8"))
        except Exception:
            pass
    bots = abc.get("bots", {}) if isinstance(abc.get("bots"), dict) else {}
    model_src = bots.get("yadev") or bots.get("yamind_bot") or {}
    default_chain = model_src.get("fallback_chain", ["zai-coding-plan/glm-5", "opencode/minimax-m2.5-free"])
    for dep in departments:
        name = dep["name"]
        token_env = new_deps[name]["token_env"]
        if name not in bots:
            bots[name] = {
                "backend": "glm",
                "model_tier": "medium",
                "fallback_chain": default_chain,
                "api_key_env": token_env,
            }
        else:
            bots[name].setdefault("api_key_env", token_env)
    abc["bots"] = bots
    abc_path.write_text(json.dumps(abc, indent=2) + "\n", encoding="utf-8")

    print(f"synced: {agency_root}")

PY
