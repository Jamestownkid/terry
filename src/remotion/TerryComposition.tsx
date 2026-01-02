// TERRY COMPOSITION - renders video with effects
import React from 'react'
import { Composition } from 'remotion'
import { TerryVideo } from './TerryVideo'

export const TerryComposition: React.FC = () => {
  return (
    <Composition
      id="TerryVideo"
      component={TerryVideo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        manifest: {
          mode: 'documentary',
          duration: 30,
          fps: 30,
          width: 1920,
          height: 1080,
          sourceVideo: '',
          scenes: []
        }
      }}
      calculateMetadata={({ props }) => {
        const m = props.manifest
        return {
          durationInFrames: Math.round(m.duration * m.fps),
          fps: m.fps,
          width: m.width,
          height: m.height
        }
      }}
    />
  )
}

