#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from typing import Dict, Any


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = Path(os.environ.get("YASWARM_WORKSPACE", ROOT / "projects" / "yaswarm-desk-workspace"))
AGENCY_ENV = WORKSPACE / "agency" / ".env"
ROOT_ENV = Path("/root/agency.env")


def load_env(path: Path) -> Dict[str, str]:
    out: Dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def get_api_base() -> str:
    env = load_env(AGENCY_ENV)
    root_env = load_env(ROOT_ENV)
    return (
        os.environ.get("YASWARM_API_BASE")
        or env.get("YASWARM_API_BASE")
        or root_env.get("YASWARM_API_BASE")
        or "https://agency.yascene.com"
    ).rstrip("/")


def get_token() -> str:
    env = load_env(AGENCY_ENV)
    root_env = load_env(ROOT_ENV)
    token = (
        os.environ.get("YASWARM_TOKEN")
        or env.get("YASWARM_TOKEN")
        or root_env.get("YASWARM_TOKEN")
        or "Step2Agency"
    )
    return token


def call_api(method: str, path: str, payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
    base = get_api_base()
    token = get_token()
    url = f"{base}{path}"
    body = None
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            raw = resp.read().decode("utf-8")
            return {"ok": True, "status": resp.getcode(), "data": json.loads(raw) if raw else {}}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8") if hasattr(e, "read") else ""
        try:
            data = json.loads(raw) if raw else {}
        except Exception:
            data = {"error": raw or str(e)}
        return {"ok": False, "status": e.code, "error": data.get("error") or str(e), "data": data}
    except Exception as e:
        return {"ok": False, "status": 0, "error": str(e), "data": {}}


def print_json(obj: Any) -> None:
    print(json.dumps(obj, ensure_ascii=True, indent=2))


def cmd_backend_capabilities(args: argparse.Namespace) -> int:
    r = call_api("GET", f"/api/bots/backend-capabilities?backend={args.backend}")
    if not r["ok"]:
        print_json(r)
        return 1
    print_json(r["data"])
    return 0


def cmd_department_update(args: argparse.Namespace) -> int:
    payload: Dict[str, Any] = {}
    for k in ["backend", "modelTier", "model", "backendUrl", "topicName", "role", "botName", "botId"]:
        v = getattr(args, k, None)
        if v is not None:
            payload[k] = v
    if args.fallbackModels:
        payload["fallbackModels"] = [x.strip() for x in args.fallbackModels.split(",") if x.strip()]
    if args.providerIds:
        payload["providerIds"] = [x.strip() for x in args.providerIds.split(",") if x.strip()]
    payload["autoInstallBackend"] = bool(args.autoInstallBackend)
    r = call_api("PATCH", f"/api/bots/departments/{args.departmentId}", payload)
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_governor_status(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/resource/governor")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_governor_set(args: argparse.Namespace) -> int:
    payload: Dict[str, Any] = {}
    if args.enabled is not None:
        payload["enabled"] = args.enabled.lower() in {"1", "true", "yes", "on"}
    if args.autoDelay is not None:
        payload["autoDelayEnabled"] = args.autoDelay.lower() in {"1", "true", "yes", "on"}
    r = call_api("PUT", "/api/resource/governor", payload)
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_permissions_get(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/cli-permissions")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_permissions_set(args: argparse.Namespace) -> int:
    payload: Dict[str, Any] = {}
    if args.subagentHead is not None:
        payload["requireHeadApprovalForSubagentEscalation"] = args.subagentHead.lower() in {"1", "true", "yes", "on"}
    if args.headCeo is not None:
        payload["requireCeoApprovalForHeadEscalation"] = args.headCeo.lower() in {"1", "true", "yes", "on"}
    if args.ceoUser is not None:
        payload["requireUserApprovalForCeoEscalation"] = args.ceoUser.lower() in {"1", "true", "yes", "on"}
    if args.allowSubagentFull is not None:
        payload["allowSubagentFullAccess"] = args.allowSubagentFull.lower() in {"1", "true", "yes", "on"}
    r = call_api("PUT", "/api/cli-permissions", payload)
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_approvals_list(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/approvals")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_approval_approve(args: argparse.Namespace) -> int:
    payload = {"note": args.note or ""}
    if args.approvedCommand:
        payload["approvedCommand"] = args.approvedCommand
    r = call_api("POST", f"/api/approvals/{args.approvalId}/approve", payload)
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_approval_reject(args: argparse.Namespace) -> int:
    payload = {"note": args.note or ""}
    r = call_api("POST", f"/api/approvals/{args.approvalId}/reject", payload)
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_terminal_exec(args: argparse.Namespace) -> int:
    payload: Dict[str, Any] = {
        "command": args.command,
        "taskName": args.taskName or "task",
        "taskWeight": args.taskWeight,
        "actorRole": args.actorRole,
        "requestedAccess": args.requestedAccess,
    }
    if args.force:
        payload["force"] = True
    if args.approvalId:
        payload["approvalId"] = args.approvalId
    r = call_api("POST", f"/api/terminal/sessions/{args.sessionId}/exec", payload)
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_skills_list(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/skills")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_skills_routing(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/skills/routing")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_skill_get(args: argparse.Namespace) -> int:
    skill_name = urllib.parse.quote(args.name, safe="")
    r = call_api("GET", f"/api/skills/{skill_name}")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_mcp_servers(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/mcp/servers")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_mcp_tools(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/mcp/tools")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_mcp_registry(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/mcp/registry")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_mcp_config(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/mcp/config")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_mcp_env_list(_: argparse.Namespace) -> int:
    r = call_api("GET", "/api/mcp/env")
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def cmd_mcp_env_set(args: argparse.Namespace) -> int:
    r = call_api("PUT", "/api/mcp/env", {"key": args.key, "value": args.value})
    print_json(r["data"] if r["ok"] else r)
    return 0 if r["ok"] else 1


def main() -> int:
    ap = argparse.ArgumentParser(description="YaSwarm agency API helper")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("backend-capabilities")
    p.add_argument("backend")
    p.set_defaults(fn=cmd_backend_capabilities)

    p = sub.add_parser("department-update")
    p.add_argument("departmentId")
    p.add_argument("--backend")
    p.add_argument("--modelTier")
    p.add_argument("--model")
    p.add_argument("--fallbackModels", help="comma list")
    p.add_argument("--providerIds", help="comma list")
    p.add_argument("--backendUrl")
    p.add_argument("--topicName")
    p.add_argument("--role")
    p.add_argument("--botName")
    p.add_argument("--botId")
    p.add_argument("--autoInstallBackend", action="store_true")
    p.set_defaults(fn=cmd_department_update)

    p = sub.add_parser("governor-status")
    p.set_defaults(fn=cmd_governor_status)

    p = sub.add_parser("governor-set")
    p.add_argument("--enabled")
    p.add_argument("--autoDelay")
    p.set_defaults(fn=cmd_governor_set)

    p = sub.add_parser("permissions-get")
    p.set_defaults(fn=cmd_permissions_get)

    p = sub.add_parser("permissions-set")
    p.add_argument("--subagentHead")
    p.add_argument("--headCeo")
    p.add_argument("--ceoUser")
    p.add_argument("--allowSubagentFull")
    p.set_defaults(fn=cmd_permissions_set)

    p = sub.add_parser("approvals-list")
    p.set_defaults(fn=cmd_approvals_list)

    p = sub.add_parser("approval-approve")
    p.add_argument("approvalId")
    p.add_argument("--note")
    p.add_argument("--approvedCommand")
    p.set_defaults(fn=cmd_approval_approve)

    p = sub.add_parser("approval-reject")
    p.add_argument("approvalId")
    p.add_argument("--note")
    p.set_defaults(fn=cmd_approval_reject)

    p = sub.add_parser("terminal-exec")
    p.add_argument("sessionId")
    p.add_argument("command")
    p.add_argument("--taskName")
    p.add_argument("--taskWeight", default="medium", choices=["light", "medium", "heavy"])
    p.add_argument("--actorRole", default="subagent", choices=["subagent", "head", "ceo", "user"])
    p.add_argument("--requestedAccess", default="default", choices=["default", "full"])
    p.add_argument("--approvalId")
    p.add_argument("--force", action="store_true")
    p.set_defaults(fn=cmd_terminal_exec)

    p = sub.add_parser("skills-list")
    p.set_defaults(fn=cmd_skills_list)

    p = sub.add_parser("skills-routing")
    p.set_defaults(fn=cmd_skills_routing)

    p = sub.add_parser("skill-get")
    p.add_argument("name")
    p.set_defaults(fn=cmd_skill_get)

    p = sub.add_parser("mcp-servers")
    p.set_defaults(fn=cmd_mcp_servers)

    p = sub.add_parser("mcp-tools")
    p.set_defaults(fn=cmd_mcp_tools)

    p = sub.add_parser("mcp-registry")
    p.set_defaults(fn=cmd_mcp_registry)

    p = sub.add_parser("mcp-config")
    p.set_defaults(fn=cmd_mcp_config)

    p = sub.add_parser("mcp-env-list")
    p.set_defaults(fn=cmd_mcp_env_list)

    p = sub.add_parser("mcp-env-set")
    p.add_argument("key")
    p.add_argument("value")
    p.set_defaults(fn=cmd_mcp_env_set)

    args = ap.parse_args()
    return args.fn(args)


if __name__ == "__main__":
    raise SystemExit(main())
