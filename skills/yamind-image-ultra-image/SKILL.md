---
name: yamind-image-ultra-image
description: "Free local image generation via ComfyUI + Stable Diffusion. Use when: (1) Generating images from text prompts, (2) Image-to-image editing, (3) Upscaling images, (4) Style transfer, (5) Creating book covers, posters, illustrations, (6) Video generation, (7) Batch image processing. No API keys needed - runs locally. Falls back to Pollinations.ai cloud if ComfyUI unavailable."
---

# Ultra Image - ComfyUI Integration

Free, local image generation using ComfyUI and Stable Diffusion models.

## Quick Start

```python
from scripts.comfyui_client import generate_image

result = generate_image(
    prompt="A mystical forest at sunset, digital art",
    model="sdxl",
    output_dir="~/Pictures/generated"
)
```

## Available Models

| Model | ID | Speed | Quality | Best For |
|-------|-----|-------|---------|----------|
| SD Turbo | `sd-turbo` | Fastest | Good | Quick drafts |
| SDXL Turbo | `sdxl-turbo` | Fast | Better | Iterations |
| SDXL | `sdxl` | Medium | High | Final output |
| Flux Dev | `flux-dev` | Slow | Best | High-quality art |

## Capabilities

### Text-to-Image
```bash
python scripts/comfyui_client.py --prompt "cyberpunk city" --model sdxl
```

### Image-to-Image
Load an image and modify it with a prompt. Uses img2img workflow.

### Upscaling
Use ESRGAN/SwinIR models to upscale images 2x-4x.

### Batch Generation
Generate multiple variations with different seeds.

### Style Transfer
Apply artistic styles using LoRA or style models.

### ControlNet
Guide generation with depth, pose, or edge maps.

## ComfyUI API

### Check Status
```bash
curl http://127.0.0.1:8188/system_stats
```

### Queue Prompt
```python
import json, urllib.request
workflow = json.load(open("workflow.json"))
resp = urllib.request.urlopen(
    "http://127.0.0.1:8188/prompt",
    json.dumps({"prompt": workflow}).encode()
)
print(json.loads(resp.read())["prompt_id"])
```

### WebSocket Progress
```python
import websocket
ws = websocket.WebSocket()
ws.connect("ws://127.0.0.1:8188/ws")
while True:
    msg = ws.recv()
    print(msg)  # Progress updates
```

## Fallback: Pollinations.ai

If ComfyUI unavailable, automatically fallback to Pollinations.ai (free, no API key):

```python
from scripts.comfyui_client import pollinations_fallback
result = pollinations_fallback("abstract art", 1024, 1024, "~/Pictures", "output.png")
```

## Workflow Templates

Templates are in `assets/`:
- `text_to_image_sdxl.json` - SDXL text-to-image
- `text_to_image_flux.json` - Flux text-to-image
- `image_to_image_sdxl.json` - Image-to-image editing
- `upscale_esrgan.json` - Image upscaling

To create custom workflows:
1. Build workflow in ComfyUI GUI
2. Enable Dev mode (Settings → Dev)
3. Export as API JSON
4. Save to `assets/`

## Sampling Parameters

| Param | Default | Range | Effect |
|-------|---------|-------|--------|
| steps | 20 | 1-100 | Quality vs speed |
| cfg | 7.0 | 1-20 | Prompt adherence |
| seed | random | 0-2^32 | Reproducibility |
| sampler | euler | multiple | Algorithm choice |

### Recommended Samplers
- **Quality**: `dpmpp_2m_sde`, `dpmpp_3m_sde`
- **Speed**: `euler`, `euler_ancestral`
- **Turbo models**: `euler_ancestral`

## Integration with YaMac

### Telegram
```
/do generate image: a sunset over mountains
```

### Model Routing
Configured via `ultra-image` backend in `~/yamac-core/config/codex-model-routing.json`.

### Skill Routing
Auto-selected for tasks containing: image, generate, art, cover, poster, illustration.

## References

- `references/comfyui-capabilities.md` - Full capability reference
- `references/comfyui_workflows.md` - Workflow examples
- `references/cloud_providers.md` - Cloud fallback options

## Requirements

- ComfyUI Desktop installed (or running server)
- Models downloaded to ComfyUI models folder
- Python with Pillow (installed)

## Troubleshooting

### ComfyUI not running
- Open ComfyUI.app from Applications
- Or start server: `python main.py` in ComfyUI directory

### Model not found
- Download from HuggingFace or Civitai
- Place in `~/ComfyUI/models/checkpoints/`

### Out of memory
- Use `--lowvram` flag
- Use smaller models (Turbo variants)
- Reduce resolution