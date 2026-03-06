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

echo "== YaMind Swarm First-Time Onboarding =="
owner="$(prompt_default 'GitHub owner/org for repos' "${GITHUB_OWNER:-YaRepo}")"
read -r -p "GitHub token (leave empty to keep current gh auth): " token || true

providers="$(prompt_default 'LLM providers (comma-separated: openai,anthropic,google,openrouter)' 'openai,google')"
agency_type="$(prompt_default 'Agency type (software-agency, media-studio, research-lab, custom)' 'software-agency')"
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

python3 - "$ONBOARD_JSON" "$owner" "$providers" "$agency_type" "$telegram_mode" << 'PY'
import json,sys,datetime
out,owner,providers,atype,tmode=sys.argv[1:]
now=datetime.datetime.now(datetime.UTC).replace(microsecond=0).isoformat().replace("+00:00","Z")
obj={
  "version":"1.0.0",
  "updated_at":now,
  "github_owner":owner,
  "providers":[p.strip() for p in providers.split(',') if p.strip()],
  "agency_type":atype,
  "telegram_threads_enabled":tmode.lower() in ("yes","y","true","1")
}
with open(out,'w',encoding='utf-8') as f:
  json.dump(obj,f,indent=2)
print(out)
PY

# Generate starter agency structure from template
python3 - "$AGENCY_JSON" "$agency_type" "$telegram_mode" << 'PY'
import json,sys,datetime
out,atype,tmode=sys.argv[1:]
now=datetime.datetime.now(datetime.UTC).replace(microsecond=0).isoformat().replace("+00:00","Z")
base={
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
deps=base.get(atype,{"departments":["operations","execution","research"]})["departments"]
obj={
  "version":"1.0.0",
  "updated_at":now,
  "ceo":"yamind",
  "agency_type":atype,
  "telegram_threads_enabled":tmode.lower() in ("yes","y","true","1"),
  "departments":[
    {
      "name":d,
      "head":f"head-{d}",
      "subagents":[f"{d}-planner",f"{d}-executor",f"{d}-reviewer"]
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
