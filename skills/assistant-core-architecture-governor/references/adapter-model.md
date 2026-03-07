# Adapter Model Policy

Supported boundary patterns:
- HTTP daemon with SSE stream
- stdio JSON-RPC child process

Adapter requirements:
- Explicit transport declaration
- Retry/restart strategy
- Timeouts and error taxonomy
- Isolation of adapter failures from core loop
