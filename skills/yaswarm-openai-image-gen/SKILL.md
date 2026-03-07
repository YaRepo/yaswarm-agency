---
name: yaswarm-openai-image-gen
description: Generate images through OpenAI Images API using bundled Python script. Use when user wants prompt-based image generation with model/size/quality control.
metadata:
  source:
    repository: https://github.com/yaswarm/yaswarm
    path: skills/openai-image-gen
    license: MIT
---

# YaSwarm OpenAI Image Gen (Adapted)

Generate images with `scripts/gen.py`.

## Use This Skill When
- User asks for AI-generated images from prompts.

## Prerequisites
- `OPENAI_API_KEY` set.
- `python3` available.

## Workflow
1. Confirm prompt + model/size if provided.
2. Run generator script.
3. Return output folder and key files.

## Commands
```bash
python3 scripts/gen.py --prompt "ultra-detailed studio photo of a lobster astronaut" --count 1
python3 scripts/gen.py --count 4 --model gpt-image-1 --size 1536x1024 --quality high
python3 scripts/gen.py --model dall-e-3 --style vivid --prompt "serene mountain landscape"
```

## Safety Rules
- Follow content policy constraints.
- Don’t expose API keys in output.

## Output Contract
1. Output path.
2. Generated files summary.
