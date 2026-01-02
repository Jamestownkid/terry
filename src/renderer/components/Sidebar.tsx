// SIDEBAR FOR TERRY - shows jobs and navigation
// like hits has so u can see ur stuff

import React from 'react'
import { Home, Film, Settings, Loader2, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'
import { JobInfo } from './JobPanel'
import clsx from 'clsx'

interface SidebarProps {
  jobs: JobInfo[]
  currentJobId?: string
  onSelectJob: (job: JobInfo) => void
  onHome: () => void
  onSettings: () => void
  currentPage: string
}

const statusEmoji: Record<string, string> = {
  transcribing: '🎤',
  generating: '🧠',
  rendering: '🎬',
  complete: '✅',
  error: '❌',
}

export const Sidebar: React.FC<SidebarProps> = ({
  jobs,
  currentJobId,
  onSelectJob,
  onHome,
  onSettings,
  currentPage,
}) => {
  const activeJobs = jobs.filter(j => j.status !== 'error')
  const hasRunning = jobs.some(j => ['transcribing', 'generating', 'rendering'].includes(j.status))

  return (
    <div className="w-64 bg-white border-r border-terry-border flex flex-col h-full">
      {/* nav */}
      <nav className="p-3 border-b border-terry-border">
        <button
          onClick={onHome}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1',
            currentPage === 'home'
              ? 'bg-terry-accent/10 text-terry-accent'
              : 'hover:bg-terry-bg text-terry-muted hover:text-terry-text'
          )}
        >
          <Home size={18} />
          <span className="font-medium">Home</span>
        </button>
        <button
          onClick={onSettings}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            currentPage === 'settings'
              ? 'bg-terry-accent/10 text-terry-accent'
              : 'hover:bg-terry-bg text-terry-muted hover:text-terry-text'
          )}
        >
          <Settings size={18} />
          <span className="font-medium">Settings</span>
        </button>
      </nav>

      {/* jobs list */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-semibold text-terry-muted uppercase tracking-wider mb-2 flex items-center gap-2">
          Your Projects
          {hasRunning && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
        </div>

        {activeJobs.length === 0 ? (
          <div className="text-sm text-terry-muted text-center py-8">
            No projects yet.<br />Pick a style to start!
          </div>
        ) : (
          <div className="space-y-2">
            {activeJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => onSelectJob(job)}
                className={clsx(
                  'w-full text-left p-3 rounded-lg transition-all',
                  currentJobId === job.id
                    ? 'bg-terry-accent/10 border border-terry-accent/30'
                    : 'bg-terry-bg hover:bg-terry-hover border border-transparent'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{statusEmoji[job.status] || '📹'}</span>
                  <span className="font-medium text-sm truncate flex-1">{job.name}</span>
                  <ChevronRight size={14} className="text-terry-muted" />
                </div>
                <div className="text-xs text-terry-muted truncate">{job.mode}</div>
                
                {/* progress bar for active jobs */}
                {['transcribing', 'generating', 'rendering'].includes(job.status) && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-terry-muted mb-1">
                      <span>
                        {job.status === 'transcribing' && 'Transcribing...'}
                        {job.status === 'generating' && 'Generating...'}
                        {job.status === 'rendering' && 'Rendering...'}
                      </span>
                      <span>{Math.round(job.progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-terry-border rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full transition-all duration-500',
                          job.status === 'transcribing' && 'bg-blue-500',
                          job.status === 'generating' && 'bg-purple-500',
                          job.status === 'rendering' && 'bg-orange-500'
                        )}
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* complete indicator */}
                {job.status === 'complete' && (
                  <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle size={12} />
                    Ready to export!
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="p-3 border-t border-terry-border text-xs text-terry-muted text-center">
        {jobs.length} project{jobs.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}

