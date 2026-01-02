// RENDER SERVICE - renders video using remotion
// simplified for terry - NOW WORKS IN PACKAGED APPS!

import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'
import * as path from 'path'
import { app } from 'electron'

export interface RenderProgress {
  percent: number
  frame: number
  totalFrames: number
  eta: number
  stage: string
}

let bundlePath: string | null = null

// figure out where we are - dev vs packaged
function getAppPath(): string {
  const possible = [
    process.resourcesPath ? path.join(process.resourcesPath, 'app') : null,
    app?.getAppPath?.() || null,
    process.cwd(),
    __dirname,
  ].filter(Boolean) as string[]
  
  const fs = require('fs')
  
  for (const p of possible) {
    try {
      const testPath = path.join(p, 'src/remotion/index.ts')
      if (fs.existsSync(testPath)) {
        console.log('[render] found app path:', p)
        return p
      }
    } catch {}
  }
  
  console.log('[render] falling back to:', possible[0])
  return possible[0] || process.cwd()
}

export async function render(
  manifest: any,
  outputPath: string,
  onProgress?: (progress: RenderProgress) => void
): Promise<void> {
  // bundle if not already done
  if (!bundlePath) {
    console.log('[render] bundling...')
    const appPath = getAppPath()
    
    // try both .ts and .tsx
    const fs = require('fs')
    let entryPoint = path.join(appPath, 'src/remotion/index.ts')
    if (!fs.existsSync(entryPoint)) {
      entryPoint = path.join(appPath, 'src/remotion/index.tsx')
    }
    
    console.log('[render] entry point:', entryPoint)
    bundlePath = await bundle({ entryPoint })
    console.log('[render] bundle complete:', bundlePath)
  }

  console.log('[render] starting:', outputPath)
  console.log('[render] manifest mode:', manifest.mode)
  console.log('[render] manifest scenes:', manifest.scenes?.length || 0)

  // safety defaults
  const fps = manifest.fps || 30
  const duration = manifest.duration || 30
  const width = manifest.width || 1920
  const height = manifest.height || 1080
  const totalFrames = Math.round(duration * fps)
  
  const startTime = Date.now()

  const composition = await selectComposition({
    serveUrl: bundlePath,
    id: 'TerryVideo',
    inputProps: { manifest }
  })

  await renderMedia({
    composition: {
      ...composition,
      width,
      height,
      fps,
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
      const renderFps = renderedFrames / elapsed
      const eta = renderFps > 0 ? (totalFrames - renderedFrames) / renderFps : 0

      onProgress?.({
        percent: (renderedFrames / totalFrames) * 100,
        frame: renderedFrames,
        totalFrames,
        eta,
        stage: stitchStage || 'rendering'
      })
    }
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('[render] done in', elapsed, 'seconds:', outputPath)
}
