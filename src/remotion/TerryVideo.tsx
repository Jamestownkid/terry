// TERRY VIDEO - main video component with effects
// NOW WITH NULL CHECKS cause undefined.map() sucks
import React from 'react'
import { AbsoluteFill, Sequence, Video, Audio, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'

interface EditDecision {
  type: string
  at: number
  duration: number
  props: Record<string, any>
}

interface Scene {
  start: number
  end: number
  text: string
  edits: EditDecision[]
}

interface TerryVideoProps {
  manifest: {
    mode: string
    duration: number
    fps: number
    width: number
    height: number
    sourceVideo: string
    scenes: Scene[]
  }
}

// effect components
const ZoomPulse: React.FC<{ intensity?: number; durationInFrames: number }> = ({ intensity = 1.2, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const scale = spring({ fps, frame, config: { damping: 12 }, durationInFrames })
  const zoom = interpolate(scale, [0, 0.5, 1], [1, intensity, 1])
  return <AbsoluteFill style={{ transform: `scale(${zoom})` }} />
}

const TextReveal: React.FC<{ text: string; durationInFrames: number }> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const scale = spring({ fps, frame, config: { damping: 10 }, durationInFrames: 15 })
  return (
    <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        fontSize: 72,
        fontWeight: 'bold',
        color: 'white',
        textShadow: '2px 2px 10px rgba(0,0,0,0.5)',
        transform: `scale(${scale})`,
        opacity: scale
      }}>
        {text}
      </div>
    </AbsoluteFill>
  )
}

const Shake: React.FC<{ intensity?: number; durationInFrames: number }> = ({ intensity = 10, durationInFrames }) => {
  const frame = useCurrentFrame()
  const decay = interpolate(frame, [0, durationInFrames], [1, 0])
  const x = (Math.random() - 0.5) * intensity * decay
  const y = (Math.random() - 0.5) * intensity * decay
  return <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px)` }} />
}

const Flash: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, durationInFrames / 2, durationInFrames], [0, 1, 0])
  return <AbsoluteFill style={{ backgroundColor: 'white', opacity }} />
}

const Vignette: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  return (
    <AbsoluteFill style={{
      background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)'
    }} />
  )
}

const ColorGrade: React.FC<{ preset?: string; durationInFrames: number }> = ({ preset = 'cinematic', durationInFrames }) => {
  const filters: Record<string, string> = {
    cinematic: 'contrast(110%) saturate(90%)',
    warm: 'sepia(20%) saturate(110%)',
    cold: 'saturate(90%) hue-rotate(10deg)'
  }
  return <AbsoluteFill style={{ filter: filters[preset] || filters.cinematic }} />
}

// SUBTITLE OVERLAY - always shows the transcript
const SubtitleOverlay: React.FC<{ text: string }> = ({ text }) => {
  return (
    <AbsoluteFill style={{ 
      display: 'flex', 
      alignItems: 'flex-end', 
      justifyContent: 'center',
      paddingBottom: 60 
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        padding: '12px 24px',
        borderRadius: 8,
        maxWidth: '80%'
      }}>
        <p style={{ color: 'white', fontSize: 28, margin: 0, textAlign: 'center' }}>
          {text}
        </p>
      </div>
    </AbsoluteFill>
  )
}

// render edit based on type
const renderEdit = (edit: EditDecision, fps: number, sceneStart: number) => {
  const editStart = Math.round(edit.at * fps) - sceneStart
  const editDuration = Math.round(edit.duration * fps)
  
  // safety checks
  if (editStart < 0 || editDuration <= 0) return null
  
  const key = `${edit.type}-${edit.at}`
  
  switch (edit.type) {
    case 'zoom_pulse':
    case 'zoom_rapid':
    case 'zoom_slow':
      return (
        <Sequence key={key} from={editStart} durationInFrames={editDuration}>
          <ZoomPulse intensity={edit.props?.intensity || 1.15} durationInFrames={editDuration} />
        </Sequence>
      )
    case 'text_reveal':
    case 'text_pop':
    case 'text_flash':
      return (
        <Sequence key={key} from={editStart} durationInFrames={editDuration}>
          <TextReveal text={edit.props?.text || ''} durationInFrames={editDuration} />
        </Sequence>
      )
    case 'shake':
    case 'shake_intense':
      return (
        <Sequence key={key} from={editStart} durationInFrames={editDuration}>
          <Shake intensity={edit.props?.intensity || 10} durationInFrames={editDuration} />
        </Sequence>
      )
    case 'flash':
      return (
        <Sequence key={key} from={editStart} durationInFrames={editDuration}>
          <Flash durationInFrames={editDuration} />
        </Sequence>
      )
    case 'vignette':
      return (
        <Sequence key={key} from={editStart} durationInFrames={editDuration}>
          <Vignette durationInFrames={editDuration} />
        </Sequence>
      )
    case 'color_grade':
      return (
        <Sequence key={key} from={editStart} durationInFrames={editDuration}>
          <ColorGrade preset={edit.props?.preset} durationInFrames={editDuration} />
        </Sequence>
      )
    case 'sound_hit':
    case 'sound_meme':
      if (edit.props?.file) {
        return (
          <Sequence key={key} from={editStart} durationInFrames={editDuration}>
            <Audio src={edit.props.file} volume={edit.props.volume || 1} />
          </Sequence>
        )
      }
      return null
    default:
      return null
  }
}

export const TerryVideo: React.FC<TerryVideoProps> = ({ manifest }) => {
  const { fps } = useVideoConfig()
  
  // SAFETY: default to empty array if scenes is undefined
  const scenes = manifest.scenes || []
  
  console.log('[TerryVideo] rendering:', {
    mode: manifest.mode,
    duration: manifest.duration,
    scenesCount: scenes.length,
    sourceVideo: manifest.sourceVideo
  })
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* source video */}
      {manifest.sourceVideo && (
        <AbsoluteFill>
          <Video src={manifest.sourceVideo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </AbsoluteFill>
      )}
      
      {/* no video fallback */}
      {!manifest.sourceVideo && (
        <AbsoluteFill style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ color: '#666', fontSize: 24 }}>
            Audio-only mode - No video source
          </div>
        </AbsoluteFill>
      )}
      
      {/* scenes with edits */}
      {scenes.length > 0 ? (
        scenes.map((scene, i) => {
          const sceneStart = Math.round(scene.start * fps)
          const sceneDuration = Math.round((scene.end - scene.start) * fps)
          
          // skip invalid scenes
          if (sceneDuration <= 0) return null
          
          // SAFETY: default edits to empty array
          const edits = scene.edits || []
          
          return (
            <Sequence key={i} from={sceneStart} durationInFrames={Math.max(1, sceneDuration)}>
              {/* edits */}
              {edits.map((edit) => renderEdit(edit, fps, sceneStart))}
              
              {/* subtitle if there's text */}
              {scene.text && <SubtitleOverlay text={scene.text} />}
            </Sequence>
          )
        })
      ) : (
        // no scenes - show mode indicator
        <AbsoluteFill style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <p style={{ color: 'white', fontSize: 32 }}>
            {manifest.mode?.toUpperCase() || 'TERRY'} MODE
          </p>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  )
}
