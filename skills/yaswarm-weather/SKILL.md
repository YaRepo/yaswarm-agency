---
name: yaswarm-weather
description: Current weather and short forecasts via wttr.in without API keys. Use when user asks about weather, rain chance, or travel weather checks.
metadata:
  source:
    repository: https://github.com/yaswarm/yaswarm
    path: skills/weather
    license: MIT
---

# YaSwarm Weather (Adapted)

## Use This Skill When
- User asks current weather or forecast by location.

## Workflow
1. Confirm location if ambiguous.
2. Use concise weather format first.
3. Expand to multi-day forecast if requested.

## Commands
```bash
curl -s "wttr.in/London?format=%l:+%c+%t+(feels+like+%f),+%w,+%h"
curl -s "wttr.in/London?format=v2"
curl -s "wttr.in/New+York?1"
```

## Safety Rules
- Clarify uncertain locations.
- Avoid presenting severe-weather guidance as official alerts.

## Output Contract
1. Location + current conditions.
2. Forecast window requested.
