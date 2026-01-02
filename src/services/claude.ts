// CLAUDE SERVICE - generates edit decisions for terry
// simpler than hits - fixed effects per mode

import Anthropic from '@anthropic-ai/sdk'
import { TranscriptSegment } from './whisper'

// video modes - each has preset effects (16 total)
export const VIDEO_MODES: Record<string, {
  name: string
  hitsPerMinute: number
  description: string
  effects: string[]
}> = {
  // DOCUMENTARY STYLES
  lemmino: {
    name: 'LEMMiNO Documentary',
    hitsPerMinute: 20,
    description: 'Smooth, cinematic documentary style with elegant Ken Burns effects',
    effects: ['ken_burns', 'zoom_slow', 'text_reveal', 'vignette', 'color_grade']
  },
  documentary: {
    name: 'Classic Documentary',
    hitsPerMinute: 15,
    description: 'Traditional documentary with B-roll and subtle effects',
    effects: ['ken_burns', 'fade', 'subtitle', 'color_grade']
  },
  vox: {
    name: 'Vox Explainer',
    hitsPerMinute: 25,
    description: 'Educational explainer with animated text and graphics',
    effects: ['text_reveal', 'zoom_slow', 'highlight', 'progress_bar', 'counter']
  },
  'true-crime': {
    name: 'True Crime',
    hitsPerMinute: 30,
    description: 'Dark, suspenseful documentary with dramatic zooms',
    effects: ['zoom_slow', 'vignette', 'text_reveal', 'sound_hit', 'flash']
  },
  
  // HIGH ENERGY STYLES
  mrbeast: {
    name: 'MrBeast Style',
    hitsPerMinute: 40,
    description: 'High energy with lots of zooms, sound effects, and flashy text',
    effects: ['zoom_pulse', 'shake', 'text_pop', 'flash', 'sound_hit', 'counter']
  },
  tiktok: {
    name: 'TikTok/Brainrot',
    hitsPerMinute: 55,
    description: 'Rapid fire edits, constant movement, meme sounds',
    effects: ['zoom_rapid', 'shake_intense', 'text_flash', 'sound_meme', 'glitch']
  },
  youtube: {
    name: 'YouTube Shorts',
    hitsPerMinute: 45,
    description: 'Vertical format optimized. Quick cuts, big text, sound effects',
    effects: ['zoom_pulse', 'text_pop', 'sound_hit', 'flash', 'shake']
  },
  gaming: {
    name: 'Gaming Montage',
    hitsPerMinute: 50,
    description: 'Fast paced gaming content with glitch effects and bass drops',
    effects: ['glitch', 'shake', 'zoom_pulse', 'flash', 'sound_hit', 'chromatic']
  },
  
  // EDUCATIONAL STYLES
  tutorial: {
    name: 'Tutorial',
    hitsPerMinute: 12,
    description: 'Clean, educational style with clear text and highlights',
    effects: ['text_reveal', 'highlight', 'zoom_slow', 'pointer', 'progress_bar']
  },
  course: {
    name: 'Online Course',
    hitsPerMinute: 8,
    description: 'Very clean, minimal distractions. Focus on content',
    effects: ['text_reveal', 'highlight', 'lower_third']
  },
  
  // CINEMATIC STYLES
  cinematic: {
    name: 'Cinematic',
    hitsPerMinute: 18,
    description: 'Film-like quality with letterboxing and color grading',
    effects: ['letterbox', 'color_grade', 'ken_burns', 'vignette', 'fade']
  },
  trailer: {
    name: 'Movie Trailer',
    hitsPerMinute: 35,
    description: 'Epic trailer vibes with dramatic bass drops and big text',
    effects: ['flash', 'text_reveal', 'sound_hit', 'zoom_pulse', 'letterbox']
  },
  
  // CHILL STYLES
  'chill-essay': {
    name: 'Chill Essay',
    hitsPerMinute: 15,
    description: 'Relaxed video essay style with smooth transitions',
    effects: ['ken_burns', 'fade', 'text_reveal', 'vignette']
  },
  podcast: {
    name: 'Podcast/Interview',
    hitsPerMinute: 10,
    description: 'Clean talking head format with lower thirds',
    effects: ['lower_third', 'zoom_slow', 'subtitle']
  },
  aesthetic: {
    name: 'Aesthetic/ASMR',
    hitsPerMinute: 8,
    description: 'Soft, calming vibes with gentle effects',
    effects: ['ken_burns', 'fade', 'color_grade', 'vignette']
  },
  vlog: {
    name: 'Vlog Style',
    hitsPerMinute: 22,
    description: 'Casual vlog feel with quick cuts and text pop-ups',
    effects: ['zoom_pulse', 'text_pop', 'sound_hit', 'shake']
  }
}

export interface EditDecision {
  type: string
  at: number
  duration: number
  props: Record<string, any>
}

export interface Scene {
  start: number
  end: number
  text: string
  edits: EditDecision[]
}

export interface EditManifest {
  mode: string
  duration: number
  fps: number
  width: number
  height: number
  sourceVideo: string
  scenes: Scene[]
}

export async function generateManifest(
  apiKey: string,
  transcript: { segments: TranscriptSegment[]; duration: number },
  mode: string,
  sourceVideo: string,
  sfxFiles: string[]
): Promise<EditManifest> {
  const client = new Anthropic({ apiKey })
  const modeConfig = VIDEO_MODES[mode] || VIDEO_MODES.documentary

  const formattedTranscript = transcript.segments
    .map(seg => `[${seg.start.toFixed(1)}s - ${seg.end.toFixed(1)}s] ${seg.text}`)
    .join('\n')

  const prompt = `You are a video editor creating edit points for a ${modeConfig.name} style video.

VIDEO MODE: ${modeConfig.name}
${modeConfig.description}

Target: ~${modeConfig.hitsPerMinute} edits per minute
Duration: ${transcript.duration.toFixed(1)} seconds
Expected edits: ~${Math.round((transcript.duration / 60) * modeConfig.hitsPerMinute)}

AVAILABLE EFFECTS: ${modeConfig.effects.join(', ')}

AVAILABLE SOUND FILES: ${sfxFiles.length > 0 ? sfxFiles.slice(0, 20).join(', ') : 'none'}

TRANSCRIPT:
${formattedTranscript}

Generate edit points as JSON. Each edit should:
- Match important words/moments
- Use effects from the available list
- Include sound effects when appropriate
- Maintain the target pace

Return ONLY JSON:
{
  "scenes": [
    {
      "start": 0,
      "end": 10,
      "text": "transcript text",
      "edits": [
        {"type": "zoom_pulse", "at": 2.5, "duration": 0.5, "props": {"intensity": 1.2}},
        {"type": "text_reveal", "at": 3.0, "duration": 2.0, "props": {"text": "KEYWORD"}},
        {"type": "sound_hit", "at": 2.5, "duration": 1.0, "props": {"file": "001_boom.mp3"}}
      ]
    }
  ]
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 6000,
    messages: [{ role: 'user', content: prompt }]
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('unexpected response')

  let jsonStr = content.text.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
  }

  const result = JSON.parse(jsonStr)

  return {
    mode,
    duration: transcript.duration,
    fps: 30,
    width: 1920,
    height: 1080,
    sourceVideo,
    scenes: result.scenes || []
  }
}
