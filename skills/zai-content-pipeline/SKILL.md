---
id: zai-content-pipeline
name: Z.ai Full Content Creation Pipeline
description: End-to-end content workflow for text, image, video, and narration output.
type: creative
scope: general
priority: 85
contexts: [general, agency-creative, agency-marketing]
---

# Z.ai Full Content Creation Pipeline

## When This Skill Activates
Activate for any content creation task: articles, social posts, marketing copy, book content, visual content, audio/narration.

## Available Tools
| Tool | Command | Use For |
|------|---------|---------|
| GLM-5 (text) | run_glm_direct | Articles, copy, scripts, captions |
| Image Gen (CogView-3-flash) | /image <prompt> | Cover art, social visuals, illustrations |
| Video Gen (CogVideoX-flash) | /video <prompt> | Short clips, animations, teasers |
| TTS (kazi/jam voices) | auto on short replies | Narration, audio versions |
| Vision (GLM-5-V) | send photo → analyze | Visual feedback, OCR, chart reading |

## Content Pipeline by Type

### Social Media Post
1. Write text (GLM-5-Air for speed)
2. Generate matching visual (/image)
3. Optional: 15-sec video version (/video)
4. Output: text + image + optional video

### Article / Blog Post
1. Outline → draft → edit (GLM-5)
2. Generate header image (/image, 1344x768 landscape)
3. Generate audio narration (TTS, jam voice)
4. Deliver: text + image + audio

### Book/Creative Content (Shapeshifter)
1. Draft with voice-preserving mode (GLM-5, system: voice-preserving)
2. Pass to novella-ruthless-critic for quality check
3. NO images unless explicitly requested for covers
4. Preserve: Yascene's exact voice, present tense, em-dash rules

### Marketing Campaign
1. Research audience + competitors (zai-deep-research)
2. Draft copy variants (A/B test)
3. Visual assets (/image per variant)
4. Metrics/KPIs defined before launch

## Quality Rules
- Voice-preserving: never change Yascene's words in creative work
- Images: always prompt-engineer for exact mood/style needed
- Short TTS replies only: <320 chars, no code blocks, <4 lines
- Videos: 5s for social, 10s for marketing demos

## Prompt Engineering Templates

### Image prompt template
"[Style: photorealistic/illustration/3D/minimalist], [Subject], [Setting], [Lighting: studio/natural/dramatic], [Color palette], [Mood]"

### Video prompt template
"[Action], [Setting], [Camera movement: slow pan/zoom/static], [Mood/atmosphere], [Duration: 5s]"
