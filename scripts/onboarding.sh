#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATE_DIR="$ROOT/catalog"
ONBOARD_JSON="$STATE_DIR/onboarding.json"
AGENCY_JSON="$STATE_DIR/agency-structure.json"
ENV_FILE="$ROOT/.env"

mkdir -p "$STATE_DIR" "$ROOT/projects"

prompt_default() {
  local q="$1" d="$2" v
  read -r -p "$q [$d]: " v || true
  if [[ -z "${v:-}" ]]; then echo "$d"; else echo "$v"; fi
}

echo "== YaSwarm First-Time Onboarding =="
owner="$(prompt_default 'GitHub owner/org for repos' "${GITHUB_OWNER:-YaRepo}")"
read -r -p "GitHub token (leave empty to keep current gh auth): " token || true

providers="$(prompt_default 'LLM providers (comma-separated: openai,anthropic,google,openrouter)' 'openai,google')"
agency_type="$(prompt_default 'Agency type (software-agency, media-studio, research-lab, custom)' 'software-agency')"
reference_agency="$(prompt_default 'Reference real-world company/agency to mimic (optional)' 'none')"
operating_model="$(prompt_default 'Operating model (functional,pod,matrix)' 'functional')"
telegram_mode="$(prompt_default 'Enable Telegram department thread mapping? (yes/no)' 'yes')"

if [[ -n "${token:-}" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    grep -v '^GITHUB_TOKEN=' "$ENV_FILE" > "$ENV_FILE.tmp" || true
    mv "$ENV_FILE.tmp" "$ENV_FILE"
  fi
  echo "GITHUB_TOKEN=$token" >> "$ENV_FILE"
fi

if [[ -f "$ENV_FILE" ]]; then
  grep -v '^GITHUB_OWNER=' "$ENV_FILE" > "$ENV_FILE.tmp" || true
  mv "$ENV_FILE.tmp" "$ENV_FILE"
fi
echo "GITHUB_OWNER=$owner" >> "$ENV_FILE"

python3 - "$ONBOARD_JSON" "$owner" "$providers" "$agency_type" "$reference_agency" "$operating_model" "$telegram_mode" << 'PY'
import json,sys,datetime
out,owner,providers,atype,reference,op_model,tmode=sys.argv[1:]
now=datetime.datetime.now(datetime.UTC).replace(microsecond=0).isoformat().replace("+00:00","Z")
obj={
  "version":"1.0.0",
  "updated_at":now,
  "github_owner":owner,
  "providers":[p.strip() for p in providers.split(',') if p.strip()],
  "agency_type":atype,
  "reference_agency": None if reference.strip().lower() in ("", "none", "n/a") else reference.strip(),
  "operating_model": op_model.strip().lower(),
  "telegram_threads_enabled":tmode.lower() in ("yes","y","true","1")
}
with open(out,'w',encoding='utf-8') as f:
  json.dump(obj,f,indent=2)
print(out)
PY

# Generate starter agency structure from template
python3 - "$AGENCY_JSON" "$agency_type" "$reference_agency" "$operating_model" "$telegram_mode" << 'PY'
import json,sys,datetime
out,atype,reference,op_model,tmode=sys.argv[1:]
now=datetime.datetime.now(datetime.UTC).replace(microsecond=0).isoformat().replace("+00:00","Z")
reference_norm=(reference or "").strip().lower()
op_model=(op_model or "functional").strip().lower()
if op_model not in {"functional","pod","matrix"}:
  op_model="functional"

default_by_type={
  "software-agency":{
    "departments":["engineering","product","design","qa","operations","marketing"]
  },
  "media-studio":{
    "departments":["writing","production","editing","distribution","marketing","operations"]
  },
  "research-lab":{
    "departments":["research","engineering","evaluation","ops","publishing"]
  },
}

def infer_departments(atype: str, ref: str):
  # Override defaults if the user gave a known real-world reference.
  if any(k in ref for k in ("mckinsey","bain","bcg","deloitte","accenture")):
    return ["strategy","delivery","research","client-success","operations","growth"]
  if any(k in ref for k in ("pixar","disney","dreamworks","studio","a24")):
    return ["writing","story","production","post","distribution","marketing"]
  if any(k in ref for k in ("wpp","ogilvy","publicis","dentsu","agency")):
    return ["strategy","creative","media","accounts","operations","growth"]
  if any(k in ref for k in ("openai","anthropic","deepmind","ai lab")):
    return ["research","platform","product","safety","evaluation","operations"]
  return default_by_type.get(atype,{"departments":["operations","execution","research"]})["departments"]

def subagent_triplet(dept: str, model: str):
  dept=dept.replace("_","-")
  if model=="pod":
    return [f"{dept}-lead", f"{dept}-builder", f"{dept}-analyst"]
  if model=="matrix":
    return [f"{dept}-specialist", f"{dept}-integrator", f"{dept}-qa"]
  return [f"{dept}-planner", f"{dept}-executor", f"{dept}-reviewer"]

deps=infer_departments(atype, reference_norm)
obj={
  "version":"1.0.0",
  "updated_at":now,
  "ceo":"yaswarm",
  "agency_type":atype,
  "reference_agency": None if reference_norm in ("", "none", "n/a") else reference.strip(),
  "operating_model": op_model,
  "telegram_threads_enabled":tmode.lower() in ("yes","y","true","1"),
  "departments":[
    {
      "name":d,
      "head":f"head-{d}",
      "subagents":subagent_triplet(d, op_model)
    } for d in deps
  ]
}
with open(out,'w',encoding='utf-8') as f:
  json.dump(obj,f,indent=2)
print(out)
PY

echo "Onboarding complete."
echo "- State: $ONBOARD_JSON"
echo "- Agency structure: $AGENCY_JSON"
echo "- Env updated: $ENV_FILE"

# Best-effort alignment so department config and agent registration stay in sync.
"$ROOT/scripts/sync-agency-config.sh" >/dev/null 2>&1 || true
"$ROOT/scripts/bots-manage.sh" reconcile >/dev/null 2>&1 || true
