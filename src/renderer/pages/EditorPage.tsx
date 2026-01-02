// EDITOR PAGE - the editing workflow
// transcribe -> generate -> render

import React, { useState, useEffect } from 'react'
import { FileVideo, Loader2, CheckCircle, AlertCircle, Play, Download, FolderOpen } from 'lucide-react'
import clsx from 'clsx'

interface EditorPageProps {
  sourceFile: string
  mode: string
  onBack: () => void
}

type Status = 'idle' | 'transcribing' | 'generating' | 'rendering' | 'complete' | 'error'

export const EditorPage: React.FC<EditorPageProps> = ({ sourceFile, mode, onBack }) => {
  const [status, setStatus] = useState<Status>('idle')
  const [transcript, setTranscript] = useState<any>(null)
  const [manifest, setManifest] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [outputPath, setOutputPath] = useState<string | null>(null)

  // auto-start transcription
  useEffect(() => {
    startTranscription()
  }, [])

  // progress listener
  useEffect(() => {
    const cleanup = window.api.render.onProgress((data) => {
      setProgress(data.percent)
    })
    return cleanup
  }, [])

  const startTranscription = async () => {
    setStatus('transcribing')
    setError(null)

    try {
      const result = await window.api.whisper.transcribe(sourceFile)
      
      if (result.success && result.data) {
        setTranscript(result.data)
        setError(null)
        startGeneration(result.data)
      } else {
        setStatus('error')
        setError(result.error || 'transcription failed')
      }
    } catch (err) {
      setStatus('error')
      setError('Transcription failed: ' + String(err))
    }
  }

  const startGeneration = async (transcriptData: any) => {
    setStatus('generating')
    setError(null)

    try {
      const result = await window.api.claude.generate(transcriptData, mode, sourceFile)
      
      if (result.success && result.data) {
        setManifest(result.data)
        setError(null)
        setStatus('idle')
      } else {
        setStatus('error')
        setError(result.error || 'generation failed')
      }
    } catch (err) {
      setStatus('error')
      setError('Generation failed: ' + String(err))
    }
  }

  const startRender = async () => {
    const fileName = sourceFile.split('/').pop()?.replace(/\.[^.]+$/, '') || 'output'
    const savePath = await window.api.dialog.saveFile(`${fileName}_edited.mp4`)
    
    if (!savePath) return

    setStatus('rendering')
    setProgress(0)

    const result = await window.api.render.start(manifest, savePath)
    
    if (result.success) {
      setStatus('complete')
      setOutputPath(savePath)
    } else {
      setStatus('error')
      setError(result.error || 'render failed')
    }
  }

  const getStepStatus = (step: number) => {
    if (status === 'error') return 'error'
    if (step === 1) return transcript ? 'complete' : status === 'transcribing' ? 'active' : 'pending'
    if (step === 2) return manifest ? 'complete' : status === 'generating' ? 'active' : 'pending'
    if (step === 3) return status === 'complete' ? 'complete' : status === 'rendering' ? 'active' : 'pending'
    return 'pending'
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      {/* file info */}
      <div className="card mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-terry-accent/10 flex items-center justify-center">
          <FileVideo size={24} className="text-terry-accent" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{sourceFile.split('/').pop()}</h2>
          <p className="text-sm text-terry-muted">Mode: {mode}</p>
        </div>
      </div>

      {/* loading banner when working */}
      {(status === 'transcribing' || status === 'generating' || status === 'rendering') && (
        <div className="card mb-8 bg-terry-accent/5 border-terry-accent/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-terry-accent border-t-transparent animate-spin flex-shrink-0" />
          <div>
            <p className="font-medium text-terry-accent">
              {status === 'transcribing' && 'Transcribing with Whisper...'}
              {status === 'generating' && 'Generating edits with Claude AI...'}
              {status === 'rendering' && `Rendering video... ${Math.round(progress)}%`}
            </p>
            <p className="text-sm text-terry-muted">
              {status === 'transcribing' && 'This may take 1-5 minutes'}
              {status === 'generating' && 'This may take 10-30 seconds'}
              {status === 'rendering' && 'Please wait while your video is being created'}
            </p>
          </div>
        </div>
      )}

      {/* error */}
      {error && (
        <div className="card mb-8 bg-terry-error/5 border-terry-error/20 flex items-start gap-3">
          <AlertCircle className="text-terry-error flex-shrink-0" size={20} />
          <div>
            <p className="font-medium text-terry-error">Something went wrong</p>
            <p className="text-sm text-terry-muted">{error}</p>
          </div>
        </div>
      )}

      {/* steps */}
      <div className="space-y-4 mb-8">
        {/* step 1 - transcribe */}
        <div className={clsx('card', getStepStatus(1) === 'complete' && 'border-terry-success/30')}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center',
              getStepStatus(1) === 'complete' && 'bg-terry-success text-white',
              getStepStatus(1) === 'active' && 'bg-terry-accent text-white',
              getStepStatus(1) === 'pending' && 'bg-terry-border text-terry-muted'
            )}>
              {getStepStatus(1) === 'active' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : getStepStatus(1) === 'complete' ? (
                <CheckCircle size={18} />
              ) : (
                <span>1</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Transcribing</h3>
              <p className="text-sm text-terry-muted">
                {getStepStatus(1) === 'complete' 
                  ? `${transcript?.segments?.length || 0} segments found`
                  : getStepStatus(1) === 'active'
                  ? 'Analyzing audio...'
                  : 'Waiting...'}
              </p>
            </div>
          </div>
        </div>

        {/* step 2 - generate */}
        <div className={clsx('card', getStepStatus(2) === 'complete' && 'border-terry-success/30')}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center',
              getStepStatus(2) === 'complete' && 'bg-terry-success text-white',
              getStepStatus(2) === 'active' && 'bg-terry-accent text-white',
              getStepStatus(2) === 'pending' && 'bg-terry-border text-terry-muted'
            )}>
              {getStepStatus(2) === 'active' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : getStepStatus(2) === 'complete' ? (
                <CheckCircle size={18} />
              ) : (
                <span>2</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Generating Edits</h3>
              <p className="text-sm text-terry-muted">
                {getStepStatus(2) === 'complete'
                  ? `${manifest?.scenes?.reduce((sum: number, s: any) => sum + (s.edits?.length || 0), 0) || 0} edits created`
                  : getStepStatus(2) === 'active'
                  ? 'AI is planning your edits...'
                  : 'Waiting...'}
              </p>
            </div>
          </div>
        </div>

        {/* step 3 - render */}
        <div className={clsx('card', getStepStatus(3) === 'complete' && 'border-terry-success/30')}>
          <div className="flex items-center gap-4">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center',
              getStepStatus(3) === 'complete' && 'bg-terry-success text-white',
              getStepStatus(3) === 'active' && 'bg-terry-accent text-white',
              getStepStatus(3) === 'pending' && 'bg-terry-border text-terry-muted'
            )}>
              {getStepStatus(3) === 'active' ? (
                <Loader2 size={18} className="animate-spin" />
              ) : getStepStatus(3) === 'complete' ? (
                <CheckCircle size={18} />
              ) : (
                <span>3</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Rendering</h3>
              {getStepStatus(3) === 'active' ? (
                <div className="mt-2">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-terry-muted mt-1">{Math.round(progress)}%</p>
                </div>
              ) : (
                <p className="text-sm text-terry-muted">
                  {getStepStatus(3) === 'complete' ? 'Done!' : 'Waiting...'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="flex justify-center gap-4">
        {manifest && status === 'idle' && (
          <button onClick={startRender} className="btn-primary">
            <Play size={18} />
            Render Video
          </button>
        )}
        {status === 'complete' && outputPath && (
          <>
            <button
              onClick={() => window.api.shell.showItem(outputPath)}
              className="btn-primary"
            >
              <FolderOpen size={18} />
              Show in Folder
            </button>
            <button onClick={onBack} className="btn-secondary">
              New Video
            </button>
          </>
        )}
      </div>
    </div>
  )
}

