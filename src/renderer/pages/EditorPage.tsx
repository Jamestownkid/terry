// EDITOR PAGE - the editing workflow
// transcribe -> generate -> render
// Shows CLEAR feedback when working

import React, { useState, useEffect } from 'react'
import { FileVideo, Loader2, CheckCircle, AlertCircle, Play, Download, FolderOpen, RotateCcw } from 'lucide-react'
import clsx from 'clsx'

interface EditorPageProps {
  sourceFile: string
  mode: string
  onBack: () => void
}

type Status = 'idle' | 'transcribing' | 'generating' | 'rendering' | 'complete' | 'error'

export const EditorPage: React.FC<EditorPageProps> = ({ sourceFile, mode, onBack }) => {
  const [status, setStatus] = useState<Status>('transcribing') // start immediately
  const [transcript, setTranscript] = useState<any>(null)
  const [manifest, setManifest] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState('Starting transcription...')

  // auto-start transcription on mount
  useEffect(() => {
    startTranscription()
  }, [])

  // progress listener
  useEffect(() => {
    const cleanup = window.api.render.onProgress((data) => {
      setProgress(data.percent)
      setStatusMessage(`Rendering: ${Math.round(data.percent)}%`)
    })
    return cleanup
  }, [])

  const startTranscription = async () => {
    setStatus('transcribing')
    setError(null)
    setStatusMessage('Transcribing audio with Whisper AI...')

    try {
      const result = await window.api.whisper.transcribe(sourceFile)
      
      if (result.success && result.data) {
        setTranscript(result.data)
        setError(null)
        setStatusMessage('Transcription complete!')
        // Auto-start generation
        setTimeout(() => startGeneration(result.data), 500)
      } else {
        setStatus('error')
        setError(result.error || 'Transcription failed')
        setStatusMessage('Error occurred')
      }
    } catch (err) {
      setStatus('error')
      setError('Transcription failed: ' + String(err))
      setStatusMessage('Error occurred')
    }
  }

  const startGeneration = async (transcriptData: any) => {
    setStatus('generating')
    setError(null)
    setStatusMessage('AI is creating your edit plan...')

    try {
      const result = await window.api.claude.generate(transcriptData, mode, sourceFile)
      
      if (result.success && result.data) {
        setManifest(result.data)
        setError(null)
        setStatus('idle')
        setStatusMessage('Ready to render!')
      } else {
        setStatus('error')
        setError(result.error || 'Generation failed')
        setStatusMessage('Error occurred')
      }
    } catch (err) {
      setStatus('error')
      setError('Generation failed: ' + String(err))
      setStatusMessage('Error occurred')
    }
  }

  const startRender = async () => {
    const fileName = sourceFile.split('/').pop()?.replace(/\.[^.]+$/, '') || 'output'
    const savePath = await window.api.dialog.saveFile(`${fileName}_edited.mp4`)
    
    if (!savePath) return

    setStatus('rendering')
    setProgress(0)
    setStatusMessage('Starting render...')

    try {
      const result = await window.api.render.start(manifest, savePath)
      
      if (result.success) {
        setStatus('complete')
        setOutputPath(savePath)
        setStatusMessage('Done!')
      } else {
        setStatus('error')
        setError(result.error || 'Render failed')
        setStatusMessage('Error occurred')
      }
    } catch (err) {
      setStatus('error')
      setError('Render failed: ' + String(err))
      setStatusMessage('Error occurred')
    }
  }

  const retry = () => {
    setTranscript(null)
    setManifest(null)
    setError(null)
    setOutputPath(null)
    startTranscription()
  }

  const isWorking = status === 'transcribing' || status === 'generating' || status === 'rendering'

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      {/* file info */}
      <div className="card mb-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-terry-accent/10 flex items-center justify-center">
          <FileVideo size={24} className="text-terry-accent" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{sourceFile.split('/').pop()}</h2>
          <p className="text-sm text-terry-muted">Mode: {mode}</p>
        </div>
      </div>

      {/* BIG STATUS INDICATOR - always visible when working */}
      {isWorking && (
        <div className="card mb-6 bg-gradient-to-r from-terry-accent/10 to-terry-accent/5 border-terry-accent/30">
          <div className="flex items-center gap-6 p-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-terry-accent/30 border-t-terry-accent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-terry-accent font-bold text-sm">
                  {status === 'rendering' ? `${Math.round(progress)}%` : '...'}
                </span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-terry-accent text-lg">
                {status === 'transcribing' && '🎤 Transcribing...'}
                {status === 'generating' && '🧠 Generating Edits...'}
                {status === 'rendering' && '🎬 Rendering Video...'}
              </p>
              <p className="text-terry-muted">{statusMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* error */}
      {error && (
        <div className="card mb-6 bg-terry-error/5 border-terry-error/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-terry-error flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-medium text-terry-error">Something went wrong</p>
              <p className="text-sm text-terry-muted mt-1">{error}</p>
            </div>
            <button onClick={retry} className="btn-secondary text-sm flex items-center gap-2">
              <RotateCcw size={14} />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* steps */}
      <div className="space-y-3 mb-8">
        {/* step 1 - transcribe */}
        <div className={clsx(
          'card transition-all',
          transcript && 'border-terry-success/30 bg-terry-success/5',
          status === 'transcribing' && 'border-terry-accent/50 ring-2 ring-terry-accent/20'
        )}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              transcript && 'bg-terry-success text-white',
              status === 'transcribing' && 'bg-terry-accent text-white',
              !transcript && status !== 'transcribing' && 'bg-terry-border text-terry-muted'
            )}>
              {status === 'transcribing' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : transcript ? (
                <CheckCircle size={18} />
              ) : (
                <span>1</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Transcribing</h3>
              <p className="text-sm text-terry-muted">
                {transcript 
                  ? `✓ ${transcript.segments?.length || 0} segments found`
                  : status === 'transcribing'
                  ? 'Processing audio...'
                  : 'Waiting...'}
              </p>
            </div>
          </div>
        </div>

        {/* step 2 - generate */}
        <div className={clsx(
          'card transition-all',
          manifest && 'border-terry-success/30 bg-terry-success/5',
          status === 'generating' && 'border-terry-accent/50 ring-2 ring-terry-accent/20'
        )}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              manifest && 'bg-terry-success text-white',
              status === 'generating' && 'bg-terry-accent text-white',
              !manifest && status !== 'generating' && 'bg-terry-border text-terry-muted'
            )}>
              {status === 'generating' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : manifest ? (
                <CheckCircle size={18} />
              ) : (
                <span>2</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Generating Edits</h3>
              <p className="text-sm text-terry-muted">
                {manifest
                  ? `✓ ${manifest.scenes?.length || 0} scenes, ${manifest.scenes?.reduce((sum: number, s: any) => sum + (s.effects?.length || 0), 0) || 0} effects`
                  : status === 'generating'
                  ? 'AI is planning edits...'
                  : 'Waiting...'}
              </p>
            </div>
          </div>
        </div>

        {/* step 3 - render */}
        <div className={clsx(
          'card transition-all',
          status === 'complete' && 'border-terry-success/30 bg-terry-success/5',
          status === 'rendering' && 'border-terry-accent/50 ring-2 ring-terry-accent/20'
        )}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all',
              status === 'complete' && 'bg-terry-success text-white',
              status === 'rendering' && 'bg-terry-accent text-white',
              status !== 'complete' && status !== 'rendering' && 'bg-terry-border text-terry-muted'
            )}>
              {status === 'rendering' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : status === 'complete' ? (
                <CheckCircle size={18} />
              ) : (
                <span>3</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Rendering</h3>
              <p className="text-sm text-terry-muted">
                {status === 'complete'
                  ? '✓ Video exported!'
                  : status === 'rendering'
                  ? `${Math.round(progress)}% complete`
                  : 'Ready when you are'}
              </p>
              {status === 'rendering' && (
                <div className="mt-2 h-2 bg-terry-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-terry-accent transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="flex gap-3">
        {status === 'idle' && manifest && (
          <button 
            onClick={startRender}
            className="btn-primary flex-1 py-3 text-lg"
          >
            <Play size={20} />
            Start Render
          </button>
        )}
        
        {status === 'complete' && outputPath && (
          <>
            <button 
              onClick={() => window.api.shell.showItem(outputPath)}
              className="btn-primary flex-1"
            >
              <FolderOpen size={18} />
              Show in Folder
            </button>
            <button onClick={onBack} className="btn-secondary">
              New Video
            </button>
          </>
        )}
        
        {status === 'error' && (
          <button onClick={retry} className="btn-primary flex-1">
            <RotateCcw size={18} />
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
