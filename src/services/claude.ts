// CLAUDE SERVICE - generates edit manifests
// SIMPLIFIED to avoid JSON truncation errors

import Anthropic from '@anthropic-ai/sdk'

// 10 video styles
export const VIDEO_MODES: Record<string, { name: string; description: string }> = {
  mrbeast: { name: 'MrBeast', description: 'High energy with SFX' },
  lemmino: { name: 'Lemmino', description: 'Smooth documentary' },
  tiktok: { name: 'TikTok', description: 'Rapid fire edits' },
  documentary: { name: 'Documentary', description: 'Classic B-roll' },
  tutorial: { name: 'Tutorial', description: 'Educational' },
  vox: { name: 'Vox Explainer', description: 'Animated text' },
  truecrime: { name: 'True Crime', description: 'Dark dramatic' },
  gaming: { name: 'Gaming', description: 'Fast montage' },
  podcast: { name: 'Podcast', description: 'Minimal edits' },
  aesthetic: { name: 'Aesthetic', description: 'Chill vibes' }
}

// Generate a simple manifest - NO Claude needed for basic edits
export async function generateManifest(
  apiKey: string,
  transcript: any,
  mode: string,
  sourceVideo: string,
  _sfxFiles?: string[]
): Promise<any> {
  console.log('[claude] generating manifest for mode:', mode)
  
  const duration = Math.min(transcript.duration || 60, 120)
  
  // If no API key, use local generation
  if (!apiKey || apiKey.length < 10) {
    console.log('[claude] no API key, using local generator')
    return generateLocalManifest(transcript, mode, sourceVideo, duration)
  }

  try {
    const client = new Anthropic({ apiKey })
    
    // VERY simple prompt - just ask for edit timestamps
    const prompt = `Video is ${Math.round(duration)} seconds. Mode: ${mode}.
Give me 5-10 edit points as JSON array. Just timestamps and effect names.
ONLY respond with this exact format, nothing else:
{"edits":[{"t":5,"e":"zoom"},{"t":12,"e":"text"},{"t":20,"e":"cut"}]}`

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,  // very small
      messages: [{ role: 'user', content: prompt }]
    })

    const content = response.content[0]
    if (content.type !== 'text') throw new Error('bad response')

    let text = content.text.trim()
    console.log('[claude] raw response:', text)

    // Extract JSON
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('no JSON')
    
    text = text.substring(start, end + 1)
    const data = JSON.parse(text)
    
    // Convert simple edits to full manifest
    return buildManifestFromEdits(data.edits || [], transcript, mode, sourceVideo, duration)
    
  } catch (err) {
    console.error('[claude] error:', err)
    console.log('[claude] using local fallback')
    return generateLocalManifest(transcript, mode, sourceVideo, duration)
  }
}

// Build full manifest from simple edit points
function buildManifestFromEdits(
  edits: Array<{t: number, e: string}>,
  transcript: any,
  mode: string,
  sourceVideo: string,
  duration: number
): any {
  const scenes: any[] = []
  
  // Create scenes every 10 seconds
  for (let i = 0; i < duration; i += 10) {
    const sceneEnd = Math.min(i + 10, duration)
    const sceneEdits = edits
      .filter(e => e.t >= i && e.t < sceneEnd)
      .map(e => ({
        type: e.e,
        at: e.t,
        duration: 1.5
      }))
    
    // Find transcript text for this scene
    const seg = transcript.segments?.find((s: any) => s.start >= i && s.start < sceneEnd)
    
    scenes.push({
      start: i,
      end: sceneEnd,
      text: seg?.text || '',
      effects: sceneEdits.length > 0 ? sceneEdits : [{ type: 'cut', at: i + 5, duration: 1 }]
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

// Generate manifest locally without Claude
function generateLocalManifest(
  transcript: any,
  mode: string,
  sourceVideo: string,
  duration: number
): any {
  console.log('[local] generating manifest')
  
  // Effect frequency based on mode
  const freq: Record<string, number> = {
    mrbeast: 3, tiktok: 2, gaming: 2,
    lemmino: 8, documentary: 10, podcast: 15,
    tutorial: 12, vox: 6, truecrime: 7, aesthetic: 10
  }
  const interval = freq[mode] || 8
  
  // Effects to use based on mode
  const effects: Record<string, string[]> = {
    mrbeast: ['zoom', 'shake', 'flash', 'text'],
    tiktok: ['zoom', 'glitch', 'text', 'cut'],
    gaming: ['shake', 'glitch', 'zoom', 'flash'],
    lemmino: ['pan', 'fade', 'text'],
    documentary: ['pan', 'fade', 'lower_third'],
    podcast: ['cut', 'lower_third'],
    tutorial: ['highlight', 'text', 'cut'],
    vox: ['text', 'chart', 'cut'],
    truecrime: ['fade', 'text', 'dark'],
    aesthetic: ['fade', 'color', 'pan']
  }
  const modeEffects = effects[mode] || ['zoom', 'cut', 'text']
  
  const scenes: any[] = []
  
  for (let i = 0; i < duration; i += 10) {
    const sceneEnd = Math.min(i + 10, duration)
    const sceneEffects: any[] = []
    
    // Add effects at intervals
    for (let t = i; t < sceneEnd; t += interval) {
      const effectType = modeEffects[Math.floor(Math.random() * modeEffects.length)]
      sceneEffects.push({
        type: effectType,
        at: t + Math.random() * 2,
        duration: 1 + Math.random()
      })
    }
    
    // Get transcript text
    const seg = transcript.segments?.find((s: any) => s.start >= i && s.start < sceneEnd)
    
    scenes.push({
      start: i,
      end: sceneEnd,
      text: seg?.text || '',
      effects: sceneEffects
    })
  }

  console.log('[local] created', scenes.length, 'scenes')

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
