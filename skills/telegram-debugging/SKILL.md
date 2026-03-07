---
name: telegram-debugging
description: "Diagnose and fix YaMac Telegram bridge issues: service status, logs, restart, config."
scope: global
contexts: ["*"]
---

# Telegram Bridge Debugging Skill

Use this skill when debugging issues with the YaMac Telegram bridge.

## Quick Debug Commands

### Check Bridge Status
```bash
launchctl print gui/$(id -u)/com.yarepo.yamac.telegram-bridge 2>&1 | grep -E "state|pid"
```

### View Error Logs
```bash
tail -50 /Users/yascene/yamac-core/logs/telegram-bridge.err.log
```

### View Recent Events
```bash
tail -10 /Users/yascene/yamac-core/logs/telegram-bridge.events.jsonl
```

### Check Runtime Config
```bash
cat /Users/yascene/yamac-core/logs/telegram-bridge.runtime.json
```

### Restart Bridge
```bash
launchctl kickstart -k gui/$(id -u)/com.yarepo.yamac.telegram-bridge
```

### Full Reload
```bash
launchctl unload ~/Library/LaunchAgents/com.yarepo.yamac.telegram-bridge.plist
launchctl load ~/Library/LaunchAgents/com.yarepo.yamac.telegram-bridge.plist
```

### Test OpenCode CLI Directly
```bash
cd /Users/yascene
OPENCODE_API_KEY='sk-h6DIBzGcHf1IxBiTDFOV2wzr52qgjma6l9ZSc5WQ2U0xOiss0CPFEdbbS8sAR9Z9' \
/Users/yascene/.opencode/bin/opencode run "test message" -m opencode/glm-5-free -f /Users/yascene/yamac-core/CLAUDE.md
```

## Common Issues

### 1. Model Fallback Chain Failing
- Check if API key is set: `launchctl print gui/$(id -u)/com.yarepo.yamac.telegram-bridge | grep OPENCODE`
- Test CLI directly with the same command

### 2. Wrong Tiers Shown
- Tiers are loaded from `/Users/yascene/yamac-core/config/codex-model-routing.json`
- Status shows `backend_defaults[opencode]` based on `cli_backend` setting

### 3. CLI Command Syntax
- OpenCode requires message FIRST: `opencode run "msg" -m model -f file`
- NOT: `opencode run -m model "msg"` (will fail)

### 4. Slow Response (>20s)
- Check prompt length in debug logs
- OpenCode should receive just `user_text`, not full `prompt` (includes system prompt)
- CLAUDE.md via `-f` handles system context

## Key Files

| File | Purpose |
|------|---------|
| `~/yamac-core/scripts/telegram_bridge.py` | Main bridge script |
| `~/yamac-core/config/codex-model-routing.json` | Model tier config |
| `~/yamac-core/logs/telegram-bridge.err.log` | Error output |
| `~/yamac-core/logs/telegram-bridge.events.jsonl` | Event log |
| `~/Library/LaunchAgents/com.yarepo.yamac.telegram-bridge.plist` | LaunchAgent config |

## Debug Checklist

1. [ ] Bridge running? (`launchctl print`)
2. [ ] API key set in service env?
3. [ ] Check error log for actual error message
4. [ ] Test CLI command directly from terminal
5. [ ] Compare working command vs bridge command in logs
6. [ ] Check prompt length (should be short for opencode)
