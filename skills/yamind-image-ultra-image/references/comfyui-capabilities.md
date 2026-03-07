# ComfyUI Capabilities Reference

## Overview

ComfyUI is a node-based visual AI engine for image, video, and 3D generation. It provides both a GUI and a REST API for programmatic access.

## Supported Models

### Image Models
| Model | Checkpoint Name | Best For | VRAM |
|-------|----------------|----------|------|
| SD 1.5 | sd_v1-5.safetensors | Fast, versatile | 4GB |
| SD 2.1 | sd_v2-1.safetensors | Higher quality | 6GB |
| SDXL | sdxl_base_1.0.safetensors | High quality 1024x1024 | 8GB |
| SDXL Turbo | sdxl_turbo.safetensors | Fast iterations | 8GB |
| SD Turbo | sd_turbo.safetensors | Fastest generation | 4GB |
| SD3/3.5 | sd3_medium.safetensors | Latest SD | 8GB |
| Flux Dev | flux1-dev.safetensors | Best quality | 12GB |
| Flux Schnell | flux1-schnell.safetensors | Fast Flux | 8GB |

### Video Models
| Model | Use Case |
|-------|----------|
| Stable Video Diffusion | Image to video |
| Mochi | High quality video |
| LTX-Video | Fast video generation |
| Hunyuan Video | Long videos |
| Wan 2.1/2.2 | Versatile video |

### Audio Models
| Model | Use Case |
|-------|----------|
| Stable Audio | Audio generation |
| ACE Step | Music generation |

## Core Nodes

### Essential Nodes
- `CheckpointLoaderSimple` - Load model checkpoint
- `CLIPTextEncode` - Encode text prompts
- `KSampler` - Main sampling node
- `EmptyLatentImage` - Create empty latent
- `VAEDecode` - Decode latent to image
- `SaveImage` - Save output image
- `LoadImage` - Load input image

### Advanced Nodes
- `KSamplerAdvanced` - Advanced sampling with more control
- `ControlNetApply` - Apply ControlNet conditioning
- `UpscaleModelLoader` - Load upscale models
- `ImageUpscaleWithModel` - Upscale images
- `LoraLoader` - Load LoRA adapters
- `StyleModelLoader` - Load style models

## API Endpoints

### Base URL
```
http://127.0.0.1:8188
```

### Queue Prompt
```
POST /prompt
Body: {"prompt": <workflow_json>}
Response: {"prompt_id": "<id>"}
```

### Get History
```
GET /history/<prompt_id>
Response: {<prompt_id>: {"outputs": {...}}}
```

### View Output Image
```
GET /view?filename=<name>&type=output
Response: image binary
```

### Upload Image
```
POST /upload/image
Body: multipart/form-data with image file
Response: {"name": "<filename>"}
```

### System Stats
```
GET /system_stats
Response: system information
```

### Queue Info
```
GET /queue
Response: queue status
```

### Interrupt
```
POST /interrupt
Response: {} (cancels current generation)
```

## Workflow JSON Structure

```json
{
  "<node_id>": {
    "class_type": "<NodeClassName>",
    "inputs": {
      "<input_name>": <value_or_link>
    }
  }
}
```

### Link Format
```json
["<source_node_id>", <output_index>]
```

Example:
```json
"model": ["4", 0]  // Connect to node 4, output slot 0
```

## Common Workflows

### Basic Text-to-Image
```
CheckpointLoaderSimple → CLIPTextEncode (positive)
                       → CLIPTextEncode (negative)
                       → KSampler → VAEDecode → SaveImage
                       → EmptyLatentImage
```

### Image-to-Image
```
LoadImage → VAEEncode → KSampler → VAEDecode → SaveImage
          ↑
CheckpointLoaderSimple → CLIPTextEncode
```

### Upscaling
```
LoadImage → ImageUpscaleWithModel → SaveImage
          ↑
UpscaleModelLoader
```

### ControlNet
```
LoadImage → ControlNetApply → KSampler
          ↑
ControlNetLoader
```

## Sampling Parameters

| Parameter | Range | Effect |
|-----------|-------|--------|
| steps | 1-100 | More steps = better quality, slower |
| cfg | 1-20 | Higher = more prompt adherence |
| seed | 0-2^32 | Random seed for reproducibility |
| sampler_name | euler, dpmpp_2m, etc. | Sampling algorithm |
| scheduler | normal, karras, etc. | Noise schedule |
| denoise | 0-1 | How much to change (1.0 = full) |

## Samplers

### Recommended
- `euler` - Fast, good quality
- `euler_ancestral` - Adds variation
- `dpmpp_2m` - Best quality/speed balance
- `dpmpp_2m_sde` - Higher quality, slower
- `dpmpp_3m_sde` - Best for SDXL

### For Turbo Models
- `euler_ancestral`
- `dpmpp_sde`

## Memory Optimization

### For Low VRAM
1. Use `--lowvram` flag
2. Enable smart memory offloading (automatic)
3. Use smaller models (SD Turbo, SDXL Turbo)
4. Reduce resolution

### For Apple Silicon
- MPS acceleration is automatic
- Unified memory allows larger models
- Use `--preview-method taesd` for previews

## Custom Nodes

### Essential Extensions
- `ComfyUI-Manager` - Node/package manager
- `ComfyUI-Impact-Pack` - Detection/detailing
- `ComfyUI-ControlNet` - ControlNet support
- `ComfyUI-AnimateDiff` - Animation
- `ComfyUI-IPAdapter` - Image prompting

### Installation
1. Open ComfyUI Manager (gear icon)
2. Search for node pack
3. Click Install
4. Restart ComfyUI

## Automation Patterns

### Batch Generation
```python
for seed in range(100):
    workflow["3"]["inputs"]["seed"] = seed
    prompt_id = queue_prompt(workflow)
    # Wait and save
```

### Prompt Variation
```python
prompts = ["sunset", "night", "dawn"]
for p in prompts:
    workflow["6"]["inputs"]["text"] = f"landscape, {p}"
    queue_prompt(workflow)
```

### Model Comparison
```python
models = ["sdxl", "flux-dev"]
for m in models:
    workflow["4"]["inputs"]["ckpt_name"] = f"{m}.safetensors"
    queue_prompt(workflow)
```

## Quality Tips

### For Best Quality
1. Use Flux Dev or SDXL
2. 30+ steps, cfg 7-8
3. Use dpmpp_2m_sde sampler
4. Enable TAESD previews
5. Use quality LoRAs

### For Speed
1. Use SD Turbo or SDXL Turbo
2. 4-8 steps, cfg 1-2
3. Use euler sampler
4. Lower resolution (512x512)

### For Consistency
1. Lock seed
2. Use same sampler/scheduler
3. Save workflows as JSON
4. Use fixed LoRA weights

## Integration with YaMac

### Via Skill
The `yamind-image-ultra-image` skill provides:
- `comfyui_client.py` - API client
- Automatic Pollinations fallback
- Workflow templates

### Telegram Bridge
Use `/do generate image <prompt>` to trigger via Telegram.

### Model Routing
Configured in `~/yamac-core/config/codex-model-routing.json`:
- `ultra-image` backend
- Tiers: small/medium/large/research/vision/image
