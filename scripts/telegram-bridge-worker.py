#!/usr/bin/env python3
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, UTC
from pathlib import Path
from typing import Dict, Any, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = Path(os.environ.get("YASWARM_WORKSPACE", ROOT / "projects" / "yaswarm-desk-workspace"))
AGENCY_ROOT = WORKSPACE / "agency"
CONFIG_PATH = AGENCY_ROOT / "config" / "agency-config.json"
ENV_PATH = AGENCY_ROOT / ".env"
LOG_DIR = AGENCY_ROOT / "logs"
EVENTS_LOG = LOG_DIR / "telegram-bridge.events.jsonl"
OFFSETS_FILE = LOG_DIR / "telegram-bridge.offsets.json"


def now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return default


def save_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    tmp.replace(path)


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


def http_json(url: str, payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
    data = None
    headers = {}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method="POST" if payload is not None else "GET")
    with urllib.request.urlopen(req, timeout=40) as r:
        return json.loads(r.read().decode("utf-8"))


def append_event(obj: Dict[str, Any]) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    with EVENTS_LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=True) + "\n")


def load_bridge_config() -> Tuple[List[Dict[str, Any]], Dict[int, str], int | None]:
    cfg = load_json(CONFIG_PATH, {})
    env = load_env(ENV_PATH)
    bots: List[Dict[str, Any]] = []
    thread_to_dep: Dict[int, str] = {}
    group_chat_id = cfg.get("group_chat_id")
    try:
        group_chat_id = int(group_chat_id) if group_chat_id is not None else None
    except Exception:
        group_chat_id = None

    ceo = cfg.get("ceo", {}) if isinstance(cfg.get("ceo"), dict) else {}
    ceo_tok_env = ceo.get("token_env", "YASWARM_CEO_BOT_TOKEN")
    ceo_tok = os.environ.get(ceo_tok_env) or env.get(ceo_tok_env)
    ceo_thread = ceo.get("topic_thread_id")
    try:
        ceo_thread = int(ceo_thread) if ceo_thread is not None else None
    except Exception:
        ceo_thread = None
    if ceo_tok:
        bots.append({"department": "CEO", "token": ceo_tok, "token_env": ceo_tok_env})
    if ceo_thread:
        thread_to_dep[ceo_thread] = "CEO"

    deps = cfg.get("departments", {}) if isinstance(cfg.get("departments"), dict) else {}
    for dep, dep_cfg in deps.items():
        if not isinstance(dep_cfg, dict):
            continue
        tok_env = dep_cfg.get("token_env", f"YASWARM_{dep.upper()}_BOT_TOKEN")
        tok = os.environ.get(tok_env) or env.get(tok_env)
        thread_id = dep_cfg.get("topic_thread_id")
        try:
            thread_id = int(thread_id) if thread_id is not None else None
        except Exception:
            thread_id = None
        if tok:
            bots.append({"department": dep, "token": tok, "token_env": tok_env})
        if thread_id:
            thread_to_dep[thread_id] = dep

    # de-dup by token
    dedup: Dict[str, Dict[str, Any]] = {}
    for b in bots:
        dedup[b["token"]] = b
    return list(dedup.values()), thread_to_dep, group_chat_id


def chat_reply(dep: str, text: str) -> str:
    msg = f"@{dep} {text}" if dep and dep != "CEO" else text
    p = subprocess_run(["python3", str(ROOT / "scripts" / "chat-cli.py"), "--message", msg], {"YASWARM_WORKSPACE": str(WORKSPACE)})
    if p["rc"] == 0:
        return p["out"].strip() or "Acknowledged."
    return f"Bridge error: {p['err'] or p['out'] or 'unknown chat error'}"


def subprocess_run(cmd: List[str], extra_env: Dict[str, str] | None = None) -> Dict[str, Any]:
    import subprocess

    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)
    proc = subprocess.run(cmd, text=True, capture_output=True, env=env)
    return {"rc": proc.returncode, "out": proc.stdout, "err": proc.stderr}


def process_bot(bot: Dict[str, Any], offsets: Dict[str, int], thread_to_dep: Dict[int, str], group_chat_id: int | None) -> int:
    token = bot["token"]
    dep_default = bot["department"]
    key = bot.get("token_env", dep_default)
    offset = int(offsets.get(key, 0))

    try:
        q = urllib.parse.urlencode({"timeout": 1, "offset": offset})
        data = http_json(f"https://api.telegram.org/bot{token}/getUpdates?{q}")
    except urllib.error.URLError:
        return offset
    except Exception:
        return offset

    if not data.get("ok"):
        return offset

    for upd in data.get("result", []):
        update_id = int(upd.get("update_id", 0))
        if update_id >= offset:
            offset = update_id + 1

        msg = upd.get("message") or upd.get("edited_message")
        if not isinstance(msg, dict):
            continue
        frm = msg.get("from") or {}
        if frm.get("is_bot"):
            continue
        text = (msg.get("text") or "").strip()
        if not text:
            continue

        chat = msg.get("chat") or {}
        chat_id = int(chat.get("id", 0))
        thread_id = msg.get("message_thread_id")
        try:
            thread_id = int(thread_id) if thread_id is not None else None
        except Exception:
            thread_id = None

        if group_chat_id is not None and chat_id != group_chat_id:
            continue
        if thread_id is None:
            continue

        dep = thread_to_dep.get(thread_id, dep_default)
        append_event(
            {
                "ts": now_iso(),
                "source_type": "inbound",
                "update_id": update_id,
                "message_id": msg.get("message_id"),
                "date": msg.get("date"),
                "chat_id": chat_id,
                "chat_type": chat.get("type"),
                "chat_title": chat.get("title"),
                "thread_id": thread_id,
                "from_id": frm.get("id"),
                "username": frm.get("username"),
                "first_name": frm.get("first_name"),
                "from_is_bot": False,
                "text": text,
                "department": dep,
            }
        )

        reply = chat_reply(dep, text)
        payload = {"chat_id": chat_id, "text": reply, "message_thread_id": thread_id}
        try:
            send = http_json(f"https://api.telegram.org/bot{token}/sendMessage", payload)
            append_event(
                {
                    "ts": now_iso(),
                    "source_type": "outbound",
                    "thread_id": thread_id,
                    "chat_id": chat_id,
                    "text": reply,
                    "department": dep,
                    "ok": bool(send.get("ok")),
                }
            )
        except Exception as err:
            append_event(
                {
                    "ts": now_iso(),
                    "source_type": "error",
                    "thread_id": thread_id,
                    "chat_id": chat_id,
                    "text": f"sendMessage failed: {err}",
                    "department": dep,
                }
            )

    offsets[key] = offset
    return offset


def run_once() -> int:
    bots, thread_to_dep, group_chat_id = load_bridge_config()
    if not bots:
        print("No Telegram bot tokens configured in agency/.env", file=sys.stderr)
        return 2

    offsets = load_json(OFFSETS_FILE, {})
    for b in bots:
        process_bot(b, offsets, thread_to_dep, group_chat_id)
    save_json(OFFSETS_FILE, offsets)
    print(f"processed bots={len(bots)} offsets_saved={OFFSETS_FILE}")
    return 0


def run_forever(interval: int) -> int:
    while True:
        rc = run_once()
        if rc not in (0, 2):
            print(f"bridge iteration rc={rc}", file=sys.stderr)
        time.sleep(max(1, interval))


def main() -> int:
    ap = argparse.ArgumentParser(description="YaSwarm Telegram bridge worker")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("run-once")
    loop = sub.add_parser("run-forever")
    loop.add_argument("--interval", type=int, default=3)
    args = ap.parse_args()

    if args.cmd == "run-once":
        return run_once()
    return run_forever(args.interval)


if __name__ == "__main__":
    raise SystemExit(main())
