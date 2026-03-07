#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import sys
from datetime import datetime, UTC
from pathlib import Path
from typing import Dict, List, Optional, Tuple


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = Path(os.environ.get("YASWARM_WORKSPACE", ROOT / "projects" / "yaswarm-desk-workspace"))
AGENCY_ROOT = WORKSPACE / "agency"
CONFIG_ROOT = AGENCY_ROOT / "config"
AGENCY_CONFIG = CONFIG_ROOT / "agency-config.json"
ENV_FILE = AGENCY_ROOT / ".env"
LOG_FILE = AGENCY_ROOT / "desk" / "sessions" / "cli-chat-history.jsonl"


def now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def load_env(path: Path) -> Dict[str, str]:
    env: Dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def upsert_env(path: Path, key: str, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines: List[str] = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
    newline = f'{key}="{value}"' if re.search(r'[\s#"\'=]', value) else f"{key}={value}"
    out: List[str] = []
    replaced = False
    for ln in lines:
        m = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=", ln)
        if m and m.group(1) == key:
            out.append(newline)
            replaced = True
        else:
            out.append(ln)
    if not replaced:
        if out and out[-1].strip():
            out.append("")
        out.append(newline)
    path.write_text("\n".join(out).rstrip() + "\n", encoding="utf-8")


def run(cmd: List[str]) -> Tuple[int, str, str]:
    p = subprocess.run(cmd, text=True, capture_output=True)
    return p.returncode, p.stdout.strip(), p.stderr.strip()


def parse_config_health() -> List[Dict[str, str]]:
    missing: List[Dict[str, str]] = []
    env = load_env(ENV_FILE)
    if not AGENCY_CONFIG.exists():
        missing.append(
            {
                "id": "agency_config",
                "message": f"Missing {AGENCY_CONFIG}",
                "fix": "Run: yaswarm upgrade --workspace <workspace_path>",
            }
        )

    # Runtime model provider gate
    rc, _, _ = run(
        [str(ROOT / "scripts" / "pi-mono.sh"), "verify-runtime", "--workspace", str(WORKSPACE), "--quiet"]
    )
    if rc != 0:
        missing.append(
            {
                "id": "model_runtime",
                "message": "Model runtime provider is not configured",
                "fix": "Run: yaswarm pi setup --command pi-mono  OR configure model-providers/model-assignments + API key",
            }
        )

    if not env.get("YASWARM_TOKEN"):
        missing.append(
            {
                "id": "yaswarm_token",
                "message": "YASWARM_TOKEN is not set (UI/API auth token)",
                "fix": 'In chat: /set YASWARM_TOKEN "<token>"',
            }
        )

    return missing


def pick_department(message: str, cfg: dict) -> str:
    m = message.strip()
    explicit = re.match(r"^@([a-zA-Z0-9_-]+)\b", m)
    if explicit:
        return explicit.group(1).lower()

    rr = (cfg or {}).get("routing_rules", {})
    kw_map = rr.get("keywords", {}) if isinstance(rr.get("keywords"), dict) else {}
    lm = m.lower()
    for dep, kws in kw_map.items():
        if not isinstance(kws, list):
            continue
        for kw in kws:
            if isinstance(kw, str) and kw.lower() in lm:
                return dep

    default_dep = rr.get("default_department")
    if isinstance(default_dep, str) and default_dep:
        return default_dep

    deps = (cfg or {}).get("departments", {})
    if isinstance(deps, dict) and deps:
        return sorted(deps.keys())[0]
    return "operations"


def dispatch_task(dep: str, text: str) -> Tuple[bool, str]:
    cmd = ["python3", str(ROOT / "swarm" / "runtime.py"), "dispatch", dep, text]
    rc, out, err = run(cmd)
    if rc != 0:
        return False, err or out or "dispatch failed"
    try:
        obj = json.loads(out)
        return True, f"Task dispatched to `{dep}` as `{obj.get('id','unknown')}` (subagent: `{obj.get('subagent','n/a')}`)."
    except Exception:
        return True, f"Task dispatched to `{dep}`."


def ensure_swarm_initialized() -> Tuple[bool, str]:
    rc, out, err = run(["python3", str(ROOT / "swarm" / "runtime.py"), "status"])
    if rc == 0:
        return True, out
    rc2, out2, err2 = run(["python3", str(ROOT / "swarm" / "runtime.py"), "init"])
    if rc2 == 0:
        return True, out2
    return False, err2 or out2 or err or out


def write_chat_log(role: str, text: str) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    line = {"ts": now_iso(), "role": role, "text": text}
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(line, ensure_ascii=True) + "\n")


def help_text() -> str:
    return "\n".join(
        [
            "YaSwarm Chat Commands:",
            "  /help                         Show commands",
            "  /exit                         Exit chat",
            "  /missing                      Show missing config/API keys",
            "  /set <ENV_KEY> <value>        Save/update key in agency/.env",
            "  /doctor                       Run yaswarm doctor",
            "  /register                     Run yaswarm register",
            "  /swarm-init                   Run yaswarm swarm init",
            "  /dispatch <dep> <task>        Dispatch directly",
            "",
            "Normal message behavior:",
            "  - Routes to inferred department and dispatches as a task.",
            "  - Use @department prefix to force route. Example: @marketing draft launch plan",
        ]
    )


def assistant_reply(message: str) -> str:
    msg = message.strip()
    cfg = load_json(AGENCY_CONFIG, {})
    missing = parse_config_health()

    if re.search(r"\b(missing|configure|config|api key|token|setup)\b", msg.lower()):
        if not missing:
            return "Config looks healthy. Use `/doctor` for full status, or send a task message to dispatch."
        lines = ["I found missing setup items:"]
        for item in missing:
            lines.append(f"- {item['message']}")
            lines.append(f"  Fix: {item['fix']}")
        lines.append('You can set keys here with: /set KEY "value"')
        return "\n".join(lines)

    ok, init_msg = ensure_swarm_initialized()
    if not ok:
        return f"Swarm is not initialized. Error:\n{init_msg}\nTry: /swarm-init"

    dep = pick_department(msg, cfg)
    clean = re.sub(r"^@[a-zA-Z0-9_-]+\s*", "", msg).strip()
    if not clean:
        return "Send a non-empty message after department mention. Example: @research analyze competitor landscape"

    good, result = dispatch_task(dep, clean)
    if good:
        if missing:
            return result + "\n\nNote: I also detected config gaps. Run `/missing` to fix them."
        return result
    return f"Dispatch failed: {result}"


def handle_command(raw: str) -> Optional[str]:
    parts = raw.strip().split()
    if not parts:
        return None
    cmd = parts[0].lower()

    if cmd == "/help":
        return help_text()
    if cmd == "/missing":
        missing = parse_config_health()
        if not missing:
            return "No critical missing items detected."
        lines = []
        for item in missing:
            lines.append(f"- {item['message']}")
            lines.append(f"  Fix: {item['fix']}")
        return "\n".join(lines)
    if cmd == "/set":
        if len(parts) < 3:
            return "Usage: /set <ENV_KEY> <value>"
        key = parts[1].strip()
        value = raw.strip().split(None, 2)[2].strip().strip('"').strip("'")
        upsert_env(ENV_FILE, key, value)
        return f"Saved `{key}` in `{ENV_FILE}`."
    if cmd == "/doctor":
        rc, out, err = run([str(ROOT / "scripts" / "doctor.sh"), str(WORKSPACE)])
        return out if rc == 0 else (out + "\n" + err).strip()
    if cmd == "/register":
        rc, out, err = run([str(ROOT / "cli" / "yaswarm"), "register"])
        return out if rc == 0 else (out + "\n" + err).strip()
    if cmd == "/swarm-init":
        rc, out, err = run([str(ROOT / "cli" / "yaswarm"), "swarm", "init"])
        return out if rc == 0 else (out + "\n" + err).strip()
    if cmd == "/dispatch":
        if len(parts) < 3:
            return "Usage: /dispatch <department> <task>"
        dep = parts[1]
        task = raw.strip().split(None, 2)[2]
        ok, msg = dispatch_task(dep, task)
        return msg if ok else f"Dispatch failed: {msg}"

    return None


def main() -> int:
    ap = argparse.ArgumentParser(description="YaSwarm interactive CEO chat")
    ap.add_argument("--message", help="Single message mode")
    args = ap.parse_args()

    if args.message:
        user = args.message.strip()
        write_chat_log("user", user)
        cmd_resp = handle_command(user) if user.startswith("/") else None
        resp = cmd_resp if cmd_resp is not None else assistant_reply(user)
        write_chat_log("assistant", resp)
        print(resp)
        return 0

    print("YaSwarm Chat (CEO)")
    print("Type /help for commands, /exit to quit.")
    while True:
        try:
            user = input("you> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("")
            break
        if not user:
            continue
        if user.lower() in {"/exit", "exit", "quit"}:
            break

        write_chat_log("user", user)
        cmd_resp = handle_command(user) if user.startswith("/") else None
        resp = cmd_resp if cmd_resp is not None else assistant_reply(user)
        write_chat_log("assistant", resp)
        print(f"yaswarm> {resp}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
