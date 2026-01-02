// CLAUDE SERVICE - generates edit manifests
// HARD-CODED EDIT DENSITY - fills the timeline properly

import Anthropic from '@anthropic-ai/sdk'

// HARD-CODED EDIT DENSITY per mode
export const VIDEO_MODES: Record<string, {
  name: string
  description: string
  editsPerMinute: number
  icon: string
  effects: string[]
}> = {
  mrbeast: { name: 'MrBeast', description: 'High energy with SFX', editsPerMinute: 40, icon: '💰', effects: ['zoom', 'shake', 'flash', 'text'] },
  lemmino: { name: 'LEMMiNO', description: 'Smooth documentary', editsPerMinute: 20, icon: '🎬', effects: ['pan', 'fade', 'text', 'zoom'] },
  tiktok: { name: 'TikTok', description: 'Rapid fire edits', editsPerMinute: 55, icon: '📱', effects: ['zoom', 'glitch', 'text', 'cut'] },
  documentary: { name: 'Documentary', description: 'Classic B-roll', editsPerMinute: 15, icon: '🎥', effects: ['pan', 'fade', 'lower_third'] },
  tutorial: { name: 'Tutorial', description: 'Educational', editsPerMinute: 12, icon: '📚', effects: ['highlight', 'text', 'cut'] },
  vox: { name: 'Vox Explainer', description: 'Animated text', editsPerMinute: 25, icon: '📊', effects: ['text', 'chart', 'cut', 'zoom'] },
  truecrime: { name: 'True Crime', description: 'Dark & dramatic', editsPerMinute: 18, icon: '🔍', effects: ['fade', 'text', 'dark', 'vignette'] },
  gaming: { name: 'Gaming', description: 'Fast montage', editsPerMinute: 50, icon: '🎮', effects: ['shake', 'glitch', 'zoom', 'flash'] },
  podcast: { name: 'Podcast', description: 'Minimal edits', editsPerMinute: 8, icon: '🎙️', effects: ['cut', 'lower_third', 'fade'] },
  aesthetic: { name: 'Aesthetic', description: 'Chill vibes', editsPerMinute: 10, icon: '✨', effects: ['fade', 'color', 'pan', 'blur'] }
}

// Generate manifest with HARD CODED edit density
export async function generateManifest(
  apiKey: string,
  transcript: any,
  mode: string,
  sourceVideo: string,
  _sfxFiles?: string[]
): Promise<any> {
  console.log('[manifest] generating for mode:', mode)
  
  const modeConfig = VIDEO_MODES[mode] || VIDEO_MODES.documentary
  const duration = transcript.duration || 60
  
  // HARD CODED: Calculate exact number of edits
  const totalEdits = Math.ceil((duration / 60) * modeConfig.editsPerMinute)
  console.log(`[manifest] HARD CODED: ${totalEdits} edits for ${Math.round(duration)}s (${modeConfig.editsPerMinute}/min)`)
  
  return generateHardCodedManifest(transcript, mode, sourceVideo, duration, modeConfig, totalEdits)
}

// HARD CODED manifest - fills timeline with exact number of edits
function generateHardCodedManifest(
  transcript: any,
  mode: string,
  sourceVideo: string,
  duration: number,
  modeConfig: typeof VIDEO_MODES[string],
  totalEdits: number
): any {
  const scenes: any[] = []
  const effects = modeConfig.effects
  
  // Exact interval between edits
  const editInterval = duration / totalEdits
  console.log(`[manifest] interval: ${editInterval.toFixed(2)}s between edits`)
  
  // Create scenes every 5 seconds
  const sceneLength = 5
  const numScenes = Math.ceil(duration / sceneLength)
  
  for (let i = 0; i < numScenes; i++) {
    const sceneStart = i * sceneLength
    const sceneEnd = Math.min((i + 1) * sceneLength, duration)
    
    const segText = (transcript.segments || [])
      .filter((s: any) => s.start >= sceneStart && s.start < sceneEnd)
      .map((s: any) => s.text)
      .join(' ')
    
    const sceneEffects: any[] = []
    const editsInScene = Math.ceil((sceneEnd - sceneStart) / editInterval)
    
    for (let j = 0; j < editsInScene; j++) {
      const editTime = sceneStart + (j * editInterval) + (Math.random() * editInterval * 0.3)
      if (editTime >= sceneEnd) break
      
      const effectType = effects[Math.floor(Math.random() * effects.length)]
      const minDur = mode === 'mrbeast' || mode === 'tiktok' || mode === 'gaming' ? 0.3 : 0.8
      const maxDur = mode === 'mrbeast' || mode === 'tiktok' || mode === 'gaming' ? 1.2 : 2.5
      
      sceneEffects.push({
        type: effectType,
        at: editTime,
        duration: minDur + Math.random() * (maxDur - minDur),
        intensity: 0.7 + Math.random() * 0.6
      })
    }
    
    scenes.push({
      start: sceneStart,
      end: sceneEnd,
      text: segText,
      effects: sceneEffects
    })
  }
  
  const totalEffects = scenes.reduce((sum, s) => sum + s.effects.length, 0)
  console.log(`[manifest] created ${scenes.length} scenes with ${totalEffects} total effects`)

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
