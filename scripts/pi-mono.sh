#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE="$ROOT/projects/yaswarm-desk-workspace"
CMD="${1:-status}"
shift || true

PI_COMMAND="pi-mono"
LLM=""
VLM=""
TTS=""

usage() {
  cat << HELP
Usage:
  scripts/pi-mono.sh status [--workspace <path>]
  scripts/pi-mono.sh verify [--workspace <path>] [--quiet]
  scripts/pi-mono.sh verify-runtime [--workspace <path>] [--quiet]
  scripts/pi-mono.sh setup [--command <binary>] [--llm <id>] [--vlm <id>] [--tts <id>] [--workspace <path>]
HELP
}

QUIET=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --workspace)
      WORKSPACE="${2:-}"
      shift 2
      ;;
    --command)
      PI_COMMAND="${2:-}"
      shift 2
      ;;
    --llm)
      LLM="${2:-}"
      shift 2
      ;;
    --vlm)
      VLM="${2:-}"
      shift 2
      ;;
    --tts)
      TTS="${2:-}"
      shift 2
      ;;
    --quiet)
      QUIET=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage
      exit 1
      ;;
  esac
done

CONFIG_DIR="$WORKSPACE/agency/config"
PI_CONFIG="$CONFIG_DIR/pi-mono.json"
PROVIDERS_CONFIG="$CONFIG_DIR/model-providers.json"
ASSIGNMENTS_CONFIG="$CONFIG_DIR/model-assignments.json"
ENV_FILE="$WORKSPACE/agency/.env"

status_cmd() {
  python3 - "$PI_CONFIG" "$PROVIDERS_CONFIG" "$ASSIGNMENTS_CONFIG" "$ENV_FILE" "$QUIET" << 'PY'
import json,os,sys,shutil
pi_cfg_path,providers_path,assign_path,env_path,quiet=sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4],int(sys.argv[5])

def load_json(p):
    if not os.path.exists(p):
        return None
    with open(p,'r',encoding='utf-8') as f:
        return json.load(f)

def load_env_file(p):
    env={}
    if not os.path.exists(p):
        return env
    with open(p,'r',encoding='utf-8') as f:
        for line in f:
            line=line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k,v=line.split('=',1)
            env[k.strip()]=v.strip()
    return env

def env_value(name, envfile):
    if not name:
        return ""
    return os.getenv(name,"") or envfile.get(name,"")

def check_pi(cfg, envfile):
    if cfg is None:
        return False, [f"missing config: {pi_cfg_path}"], {}
    backend=cfg.get("backend",{}) if isinstance(cfg.get("backend"),dict) else {}
    kind=(backend.get("type") or "cli").strip().lower()
    command=(backend.get("command") or cfg.get("command") or "pi-mono").strip()
    enabled=backend.get("enabled")
    if enabled is None:
        enabled=True
    models=cfg.get("main_models",{}) if isinstance(cfg.get("main_models"),dict) else {}
    llm=(models.get("llm") or "").strip()
    vlm=(models.get("vlm") or "").strip()
    tts=(models.get("tts") or "").strip()
    missing=[]
    if not enabled: missing.append("backend.enabled=false")
    if kind != "cli": missing.append("backend.type must be 'cli'")
    path=shutil.which(command) if command else None
    if not command: missing.append("backend.command")
    elif not path: missing.append(f"command not found: {command}")
    info={"type":kind,"enabled":enabled,"command":command,"path":path or "","llm":llm,"vlm":vlm,"tts":tts}
    return len(missing)==0, missing, info

def check_fallback(providers_cfg, assign_cfg, envfile):
    missing=[]
    if not providers_cfg:
        return False, [f"missing config: {providers_path}"], {}
    if not assign_cfg:
        return False, [f"missing config: {assign_path}"], {}
    providers=providers_cfg.get("providers")
    if not isinstance(providers,list):
        return False, ["providers must be a list"], {}
    main=assign_cfg.get("main",{}) if isinstance(assign_cfg.get("main"),dict) else {}
    provider_name=(main.get("provider") or "").strip()
    llm=(main.get("llm") or "").strip()
    vlm=(main.get("vlm") or "").strip()
    tts=(main.get("tts") or "").strip()
    if not provider_name: missing.append("main.provider")
    if not llm: missing.append("main.llm")
    if not vlm: missing.append("main.vlm")
    if not tts: missing.append("main.tts")
    selected=None
    for p in providers:
        if isinstance(p,dict) and (p.get("name") or "").strip()==provider_name:
            selected=p
            break
    if provider_name and selected is None:
        missing.append(f"provider '{provider_name}' not found in providers")
    api_key_env=((selected or {}).get("api_key_env") or "").strip()
    if selected is not None and not api_key_env:
        missing.append(f"providers[{provider_name}].api_key_env")
    if api_key_env and not env_value(api_key_env, envfile):
        missing.append(f"env:{api_key_env}")
    info={"provider":provider_name,"api_key_env":api_key_env,"llm":llm,"vlm":vlm,"tts":tts}
    return len(missing)==0, missing, info

envfile=load_env_file(env_path)
pi_cfg=load_json(pi_cfg_path)
providers_cfg=load_json(providers_path)
assign_cfg=load_json(assign_path)

pi_ok,pi_missing,pi_info=check_pi(pi_cfg, envfile)
fb_ok,fb_missing,fb_info=check_fallback(providers_cfg, assign_cfg, envfile)

if not quiet:
    if pi_ok:
        print("pi-mono status: READY")
        print(f"backend: {pi_info.get('type','')} (enabled={pi_info.get('enabled',True)})")
        print(f"command: {pi_info.get('command','')}")
        print(f"command_path: {pi_info.get('path','')}")
        if pi_info.get("llm") or pi_info.get("vlm") or pi_info.get("tts"):
            print(f"model hints: llm={pi_info.get('llm','')}, vlm={pi_info.get('vlm','')}, tts={pi_info.get('tts','')}")
    else:
        print("pi-mono status: NOT READY")
        print("missing:", ", ".join(pi_missing))
    if fb_ok:
        print("fallback status: READY")
        print(f"provider: {fb_info.get('provider','')}")
        print(f"api_key_env: {fb_info.get('api_key_env','')}")
        print(f"models: llm={fb_info.get('llm','')}, vlm={fb_info.get('vlm','')}, tts={fb_info.get('tts','')}")
    else:
        print("fallback status: NOT READY")
        print("missing:", ", ".join(fb_missing))

if pi_ok:
    raise SystemExit(0)
raise SystemExit(4)
PY
}

verify_runtime_cmd() {
  python3 - "$PI_CONFIG" "$PROVIDERS_CONFIG" "$ASSIGNMENTS_CONFIG" "$ENV_FILE" "$QUIET" << 'PY'
import json,os,sys,shutil
pi_cfg_path,providers_path,assign_path,env_path,quiet=sys.argv[1],sys.argv[2],sys.argv[3],sys.argv[4],int(sys.argv[5])

def load_json(p):
    if not os.path.exists(p):
        return None
    with open(p,'r',encoding='utf-8') as f:
        return json.load(f)

def load_env_file(p):
    env={}
    if not os.path.exists(p):
        return env
    with open(p,'r',encoding='utf-8') as f:
        for line in f:
            line=line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k,v=line.split('=',1)
            env[k.strip()]=v.strip()
    return env

def env_value(name, envfile):
    if not name:
        return ""
    return os.getenv(name,"") or envfile.get(name,"")

def pi_ready(cfg, envfile):
    if cfg is None:
        return False
    backend=cfg.get("backend",{}) if isinstance(cfg.get("backend"),dict) else {}
    kind=(backend.get("type") or "cli").strip().lower()
    command=(backend.get("command") or cfg.get("command") or "pi-mono").strip()
    enabled=backend.get("enabled")
    if enabled is None:
        enabled=True
    return bool(enabled and kind=="cli" and command and shutil.which(command))

def fallback_ready(providers_cfg, assign_cfg, envfile):
    if not providers_cfg or not assign_cfg:
        return False
    providers=providers_cfg.get("providers")
    if not isinstance(providers,list):
        return False
    main=assign_cfg.get("main",{}) if isinstance(assign_cfg.get("main"),dict) else {}
    provider_name=(main.get("provider") or "").strip()
    if not (provider_name and (main.get("llm") or "").strip() and (main.get("vlm") or "").strip() and (main.get("tts") or "").strip()):
        return False
    selected=None
    for p in providers:
        if isinstance(p,dict) and (p.get("name") or "").strip()==provider_name:
            selected=p
            break
    if not selected:
        return False
    api_key_env=(selected.get("api_key_env") or "").strip()
    return bool(api_key_env and env_value(api_key_env, envfile))

envfile=load_env_file(env_path)
ok_pi=pi_ready(load_json(pi_cfg_path), envfile)
ok_fb=fallback_ready(load_json(providers_path), load_json(assign_path), envfile)
if ok_pi or ok_fb:
    if not quiet:
        if ok_pi:
            print("runtime model provider: pi-mono")
        else:
            print("runtime model provider: direct-fallback")
    raise SystemExit(0)
if not quiet:
    print("runtime model provider: NOT READY")
    print("Configure pi-mono CLI via `yaswarm pi setup --command pi-mono` or configure fallback in model-providers.json + model-assignments.json")
raise SystemExit(5)
PY
}

setup_cmd() {
  mkdir -p "$CONFIG_DIR"
  local now
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  python3 - "$PI_CONFIG" "$PI_COMMAND" "$LLM" "$VLM" "$TTS" "$now" << 'PY'
import json,sys,os
path,command,llm,vlm,tts,now=sys.argv[1:]
cfg={}
if os.path.exists(path):
    try:
        cfg=json.load(open(path,'r',encoding='utf-8'))
    except Exception:
        cfg={}
backend=cfg.get("backend",{}) if isinstance(cfg.get("backend"),dict) else {}
backend["type"]="cli"
backend["command"]=command or "pi-mono"
backend["enabled"]=True
models=cfg.get("main_models",{}) if isinstance(cfg.get("main_models"),dict) else {}
if llm: models["llm"]=llm
if vlm: models["vlm"]=vlm
if tts: models["tts"]=tts
cfg["version"]=cfg.get("version","1.0.0")
cfg["updated_at"]=now
cfg["backend"]=backend
cfg["main_models"]=models
with open(path,'w',encoding='utf-8') as f:
    json.dump(cfg,f,indent=2)
    f.write('\n')
PY

  echo "Configured pi-mono:"
  echo "- config: $PI_CONFIG"
  echo "- backend command: ${PI_COMMAND:-pi-mono}"
  status_cmd
}

case "$CMD" in
  status)
    status_cmd
    ;;
  verify)
    status_cmd
    ;;
  verify-runtime)
    verify_runtime_cmd
    ;;
  setup)
    setup_cmd
    ;;
  *)
    echo "Unknown command: $CMD" >&2
    usage
    exit 1
    ;;
esac
