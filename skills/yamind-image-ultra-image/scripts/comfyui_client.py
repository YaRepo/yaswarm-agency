#!/usr/bin/env python3
"""
ComfyUI Client - Local Stable Diffusion image generation
"""

import json
import random
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional
import uuid

COMFYUI_URL = "http://127.0.0.1:8188"

WORKFLOWS = {
    "sd-turbo": "text_to_image_sd_turbo.json",
    "sdxl-turbo": "text_to_image_sdxl_turbo.json",
    "sdxl": "text_to_image_sdxl.json",
    "flux-dev": "text_to_image_flux.json",
    "sdxl-img2img": "image_to_image_sdxl.json",
}


def check_comfyui() -> bool:
    try:
        req = urllib.request.urlopen(f"{COMFYUI_URL}/system_stats", timeout=5)
        return req.status == 200
    except:
        return False


def queue_prompt(prompt: dict) -> str:
    data = json.dumps({"prompt": prompt}).encode("utf-8")
    req = urllib.request.Request(
        f"{COMFYUI_URL}/prompt",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    resp = urllib.request.urlopen(req, timeout=60)
    return json.loads(resp.read())["prompt_id"]


def get_history(prompt_id: str) -> dict:
    req = urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}", timeout=30)
    resp = req.read()
    return json.loads(resp) if resp else {}


def wait_for_completion(prompt_id: str, timeout: int = 300) -> Optional[dict]:
    import time

    start = time.time()
    while time.time() - start < timeout:
        history = get_history(prompt_id)
        if prompt_id in history:
            return history[prompt_id]
        time.sleep(2)
    return None


def download_image(filename: str, output_path: Path) -> Path:
    url = f"{COMFYUI_URL}/view?filename={filename}&type=output"
    req = urllib.request.urlopen(url, timeout=30)
    output_path.write_bytes(req.read())
    return output_path


def generate_image(
    prompt: str,
    model: str = "sdxl",
    negative_prompt: str = "",
    width: int = 1024,
    height: int = 1024,
    steps: int = 20,
    cfg_scale: float = 7.0,
    seed: Optional[int] = None,
    output_dir: str = "~/Pictures/generated",
    output_filename: Optional[str] = None,
) -> Optional[Path]:
    """
    Generate an image using ComfyUI.

    Returns path to generated image or None on failure.
    """
    if not check_comfyui():
        return pollinations_fallback(prompt, width, height, output_dir, output_filename)

    out_dir: Path = Path(output_dir).expanduser()
    out_dir.mkdir(parents=True, exist_ok=True)

    seed = seed or random.randint(0, 2**32 - 1)
    output_filename = output_filename or f"gen_{seed}_{uuid.uuid4().hex[:8]}.png"
    output_path: Path = out_dir / output_filename

    workflow = load_workflow(model)
    if not workflow:
        print(f"No workflow for model: {model}")
        return None

    workflow = inject_prompt(
        workflow, prompt, negative_prompt, seed, width, height, steps, cfg_scale
    )

    prompt_id = queue_prompt(workflow)
    result = wait_for_completion(prompt_id)

    if result and "outputs" in result:
        for node_id, node_output in result["outputs"].items():
            if "images" in node_output:
                img_info = node_output["images"][0]
                return download_image(img_info["filename"], output_path)

    return None


def load_workflow(model: str) -> Optional[dict]:
    model_key = model.replace("comfyui/", "")
    workflow_file = (
        Path(__file__).parent.parent / "assets" / WORKFLOWS.get(model_key, "")
    )
    if workflow_file.exists():
        return json.loads(workflow_file.read_text())
    return get_default_workflow(model_key)


def get_default_workflow(model: str) -> dict:
    return {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": 0,
                "steps": 20,
                "cfg": 7.0,
                "sampler_name": "euler",
                "scheduler": "normal",
                "denoise": 1.0,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
            },
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": f"{model}.safetensors"},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": 1024, "height": 1024, "batch_size": 1},
        },
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": "", "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": "", "clip": ["4", 1]}},
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "ComfyUI", "images": ["8", 0]},
        },
    }


def inject_prompt(workflow, prompt, negative, seed, width, height, steps, cfg):
    workflow["6"]["inputs"]["text"] = prompt
    workflow["7"]["inputs"]["text"] = negative or "blurry, low quality, distorted"
    workflow["3"]["inputs"]["seed"] = seed
    workflow["3"]["inputs"]["steps"] = steps
    workflow["3"]["inputs"]["cfg"] = cfg
    workflow["5"]["inputs"]["width"] = width
    workflow["5"]["inputs"]["height"] = height
    return workflow


def pollinations_fallback(
    prompt, width, height, output_dir, filename
) -> Optional[Path]:
    """Fallback to Pollinations.ai if ComfyUI unavailable."""
    import urllib.parse

    output_dir = Path(output_dir).expanduser()
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / (filename or f"pollinations_{uuid.uuid4().hex[:8]}.png")

    encoded = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&nologo=true"

    try:
        req = urllib.request.urlopen(url, timeout=120)
        output_path.write_bytes(req.read())
        print(f"Generated via Pollinations.ai: {output_path}")
        return output_path
    except Exception as e:
        print(f"Pollinations fallback failed: {e}")
        return None


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Generate images via ComfyUI")
    ap.add_argument("--prompt", required=True, help="Text prompt")
    ap.add_argument("--model", default="sdxl", choices=list(WORKFLOWS.keys()))
    ap.add_argument("--output", default="~/Pictures/generated")
    ap.add_argument("--width", type=int, default=1024)
    ap.add_argument("--height", type=int, default=1024)
    args = ap.parse_args()

    result = generate_image(
        args.prompt,
        args.model,
        output_dir=args.output,
        width=args.width,
        height=args.height,
    )
    if result:
        print(f"Image saved: {result}")
    else:
        print("Generation failed")
