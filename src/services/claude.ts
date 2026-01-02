// CLAUDE SERVICE - generates edit manifests
// the "King Kong" connector between SRT and edits

import Anthropic from '@anthropic-ai/sdk'

// 10 video styles
export const VIDEO_MODES: Record<string, {
  name: string
  description: string
  editFrequency: number
  overlayDuration: number
  brollMaxDuration: number
}> = {
  lemmino: {
    name: 'Lemmino / Documentary',
    description: 'Clean, cinematic with text reveals and subtle motion',
    editFrequency: 8,
    overlayDuration: 3,
    brollMaxDuration: 4
  },
  mrbeast: {
    name: 'MrBeast / High Energy',
    description: 'Fast cuts, zooms, shakes, lots of text pop-ups',
    editFrequency: 3,
    overlayDuration: 1.5,
    brollMaxDuration: 2
  },
  tiktok: {
    name: 'TikTok / Vertical Short',
    description: 'Quick cuts, captions, trendy effects',
    editFrequency: 2,
    overlayDuration: 1,
    brollMaxDuration: 2
  },
  documentary: {
    name: 'Documentary / Educational',
    description: 'Informative with lower thirds, maps, diagrams',
    editFrequency: 10,
    overlayDuration: 4,
    brollMaxDuration: 5
  },
  tutorial: {
    name: 'Tutorial / How-To',
    description: 'Step markers, highlights, progress bars',
    editFrequency: 15,
    overlayDuration: 5,
    brollMaxDuration: 3
  },
  vox: {
    name: 'Vox Explainer',
    description: 'Animated text, charts, clean graphics',
    editFrequency: 6,
    overlayDuration: 3,
    brollMaxDuration: 4
  },
  truecrime: {
    name: 'True Crime',
    description: 'Dark mood, dramatic reveals, timeline markers',
    editFrequency: 7,
    overlayDuration: 3,
    brollMaxDuration: 4
  },
  gaming: {
    name: 'Gaming / Montage',
    description: 'Fast edits, screen shake, glitch effects',
    editFrequency: 2,
    overlayDuration: 1,
    brollMaxDuration: 2
  },
  podcast: {
    name: 'Podcast / Interview',
    description: 'Minimal edits, lower thirds for speakers',
    editFrequency: 20,
    overlayDuration: 4,
    brollMaxDuration: 5
  },
  aesthetic: {
    name: 'Aesthetic / Chill',
    description: 'Slow, smooth transitions, color grading',
    editFrequency: 12,
    overlayDuration: 4,
    brollMaxDuration: 5
  }
}

export async function generateManifest(
  apiKey: string,
  transcript: any,
  mode: string,
  sourceVideo: string,
  sfxFiles?: string[]
): Promise<any> {
  const client = new Anthropic({ apiKey })
  
  const modeConfig = VIDEO_MODES[mode] || VIDEO_MODES.documentary

  // Summarize transcript to avoid token limits
  const segments = transcript.segments.slice(0, 40).map((seg: any) => ({
    s: Math.round(seg.start),
    e: Math.round(seg.end),
    t: seg.text.substring(0, 80)
  }))

  const prompt = `Generate a video edit manifest for "${modeConfig.name}" style.

DURATION: ${Math.round(transcript.duration)} seconds
STYLE: ${modeConfig.description}

TRANSCRIPT SEGMENTS:
${JSON.stringify(segments)}

Respond with ONLY this JSON structure (no markdown):
{
  "mode": "${mode}",
  "duration": ${Math.min(transcript.duration, 60)},
  "fps": 30,
  "width": 1920,
  "height": 1080,
  "sourceVideo": "${sourceVideo}",
  "scenes": [
    {
      "start": 0,
      "end": 10,
      "text": "text here",
      "effects": [
        {"type": "zoom", "at": 2, "duration": 1},
        {"type": "text_overlay", "at": 5, "text": "KEYWORD", "position": "center"}
      ]
    }
  ]
}

Add effects every ${modeConfig.editFrequency} seconds. Keep response under 1500 characters.`

  console.log('[claude] generating manifest...')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  })

  const content = response.content[0]
  if (content.type !== 'text') throw new Error('Invalid response')

  let text = content.text.trim()
  
  // Clean markdown
  if (text.startsWith('```')) {
    text = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
  }
  
  // Extract JSON
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  
  if (start === -1 || end === -1) {
    console.error('[claude] no JSON in response')
    return createFallback(transcript, mode, sourceVideo)
  }
  
  text = text.substring(start, end + 1)
  
  try {
    return JSON.parse(text)
  } catch (err) {
    console.error('[claude] parse error, using fallback')
    return createFallback(transcript, mode, sourceVideo)
  }
}

function createFallback(transcript: any, mode: string, sourceVideo: string): any {
  const scenes = []
  const duration = Math.min(transcript.duration, 60)
  
  for (let t = 0; t < duration; t += 10) {
    scenes.push({
      start: t,
      end: Math.min(t + 10, duration),
      text: transcript.segments.find((s: any) => s.start >= t)?.text || '',
      effects: [
        { type: 'zoom', at: t + 2, duration: 1 },
        { type: 'text_overlay', at: t + 5, text: 'EDIT', position: 'center' }
      ]
    })
  }
  
  return {
    mode,
    duration,
    fps: 30,
    width: 1920,
    height: 1080,
    sourceVideo,
    scenes
  }
}
