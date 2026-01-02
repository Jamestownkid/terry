// JOB PANEL - shows running jobs so u can see em even when u navigate away
// this was requested specifically cause ppl were losing their progress lol

import React from 'react'
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react'

export interface JobInfo {
  id: string
  name: string
  mode: string
  sourceFile: string
  status: 'transcribing' | 'generating' | 'rendering' | 'complete' | 'error'
  progress: number
  error?: string
  transcript?: any
  manifest?: any
}

interface JobPanelProps {
  jobs: JobInfo[]
  onSelectJob: (job: JobInfo) => void
  onRemoveJob: (id: string) => void
  currentJobId?: string
  collapsed?: boolean
}

const statusColors = {
  transcribing: 'bg-blue-500 animate-pulse',
  generating: 'bg-purple-500 animate-pulse',
  rendering: 'bg-orange-500 animate-pulse',
  complete: 'bg-green-500',
  error: 'bg-red-500',
}

const statusText = {
  transcribing: '🎤 Transcribing...',
  generating: '🧠 Generating...',
  rendering: '🎬 Rendering...',
  complete: '✅ Done!',
  error: '❌ Error',
}

export const JobPanel: React.FC<JobPanelProps> = ({
  jobs,
  onSelectJob,
  onRemoveJob,
  currentJobId,
  collapsed = false,
}) => {
  if (jobs.length === 0 || collapsed) {
    return null
  }

  return (
    <div className="fixed right-4 top-16 w-72 bg-terry-surface border border-terry-border rounded-lg shadow-xl z-50">
      <div className="px-4 py-3 border-b border-terry-border flex items-center justify-between">
        <span className="text-sm font-semibold text-terry-text flex items-center gap-2">
          Active Jobs
          {jobs.some((j) => ['transcribing', 'generating', 'rendering'].includes(j.status)) && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </span>
        <span className="text-xs text-terry-muted">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {jobs.map((job) => (
          <button
            key={job.id}
            onClick={() => onSelectJob(job)}
            className={`w-full text-left p-3 border-b border-terry-border last:border-b-0 hover:bg-terry-hover transition-colors ${
              currentJobId === job.id ? 'bg-terry-hover' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {job.status === 'complete' ? (
                    <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  ) : job.status === 'error' ? (
                    <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  ) : (
                    <Loader2 size={14} className="text-terry-accent animate-spin flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium truncate">{job.name || 'Untitled'}</span>
                </div>
                <div className="text-xs text-terry-muted truncate">{job.mode}</div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveJob(job.id)
                }}
                className="p-1 text-terry-muted hover:text-terry-text rounded"
              >
                <X size={14} />
              </button>
            </div>

            {/* progress bar */}
            {['transcribing', 'generating', 'rendering'].includes(job.status) && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-terry-muted mb-1">
                  <span>{statusText[job.status]}</span>
                  <span>{Math.round(job.progress)}%</span>
                </div>
                <div className="h-1.5 bg-terry-bg rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      job.status === 'transcribing'
                        ? 'bg-blue-500'
                        : job.status === 'generating'
                        ? 'bg-purple-500'
                        : 'bg-orange-500'
                    }`}
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* error message */}
            {job.status === 'error' && job.error && (
              <div className="mt-2 text-xs text-red-400 truncate">{job.error}</div>
            )}

            {/* completion indicator */}
            {job.status === 'complete' && (
              <div className="mt-2 text-xs text-green-400">Ready to export!</div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

