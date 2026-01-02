// RENDER SERVICE - renders video using remotion
// simplified for terry

import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import * as path from 'path'
import { EditManifest } from './claude'

export interface RenderProgress {
  percent: number
  frame: number
  totalFrames: number
  eta: number
  stage: string
}

let bundlePath: string | null = null

export async function render(
  manifest: EditManifest,
  outputPath: string,
  onProgress?: (progress: RenderProgress) => void
): Promise<void> {
  // bundle if not already done
  if (!bundlePath) {
    console.log('[render] bundling...')
    const entryPoint = path.join(process.cwd(), 'src/remotion/index.ts')
    bundlePath = await bundle({ entryPoint })
  }

  console.log('[render] starting:', outputPath)

  const totalFrames = Math.round(manifest.duration * manifest.fps)
  const startTime = Date.now()

  const composition = await selectComposition({
    serveUrl: bundlePath,
    id: 'TerryVideo',
    inputProps: { manifest }
  })

  await renderMedia({
    composition: {
      ...composition,
      width: manifest.width,
      height: manifest.height,
      fps: manifest.fps,
      durationInFrames: totalFrames
    },
    serveUrl: bundlePath,
    codec: 'h264',
    outputLocation: outputPath,
    inputProps: { manifest },
    chromiumOptions: {
      gl: 'angle-egl',
      enableMultiProcessOnLinux: true
    },
    onProgress: ({ renderedFrames, stitchStage }) => {
      const elapsed = (Date.now() - startTime) / 1000
      const fps = renderedFrames / elapsed
      const eta = fps > 0 ? (totalFrames - renderedFrames) / fps : 0

      onProgress?.({
        percent: (renderedFrames / totalFrames) * 100,
        frame: renderedFrames,
        totalFrames,
        eta,
        stage: stitchStage || 'rendering'
      })
    }
  })

  console.log('[render] done:', outputPath)
}

