---
name: yaswarm-openai-whisper-api
description: Transcribe audio files using OpenAI Audio Transcriptions API via bundled script. Use when user asks to transcribe voice/audio files quickly.
metadata:
  source:
    repository: https://github.com/yaswarm/yaswarm
    path: skills/openai-whisper-api
    license: MIT
---

# YaSwarm Whisper API (Adapted)

Transcribe local audio using `scripts/transcribe.sh`.

## Use This Skill When
- User asks to transcribe local audio/voice notes.

## Prerequisites
- `OPENAI_API_KEY` set.
- `curl` available.

## Workflow
1. Validate file exists.
2. Run transcription script.
3. Return transcript or saved output path.

## Commands
```bash
scripts/transcribe.sh /path/to/audio.m4a
scripts/transcribe.sh /path/to/audio.ogg --language en --out /tmp/transcript.txt
scripts/transcribe.sh /path/to/audio.m4a --json --out /tmp/transcript.json
```

## Safety Rules
- Never log API keys.
- Keep user audio paths private.

## Output Contract
1. Transcript text or output file path.
2. Any transcription limitations encountered.
