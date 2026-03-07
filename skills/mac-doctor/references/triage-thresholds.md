# Triage Thresholds (Intel Mac focus)

Use these as practical heuristics, not hard rules.

- CPU temperature sustained > 90C under normal interactive workload: high thermal risk.
- Fan RPM near minimum while CPU temp remains high: likely fan policy/SMC control issue.
- Memory pressure `System-wide memory free percentage` persistently low and swap activity high: memory bottleneck.
- Root volume free space < 15%: storage pressure likely to degrade performance.
- Battery condition not normal or severe discharge under light load: check battery health and background tasks.

## Prioritization

1. Thermal throttling and app crashes
2. Memory pressure and swap churn
3. Storage pressure and huge caches
4. Startup/login agent overhead
5. Cosmetic cleanup
