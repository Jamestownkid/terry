// TERRY SIDEBAR - navigation + job tracking + ERROR LOG
// users can see all running jobs and errors here

import React, { useState, useEffect } from 'react'
import { 
  Home, Settings, ChevronLeft, ChevronRight, 
  AlertCircle, Copy, Check, Trash2, ChevronDown, ChevronUp,
  Loader2, CheckCircle, XCircle, Film
} from 'lucide-react'
import clsx from 'clsx'

interface Job {
  id: string
  name: string
  mode: string
  status: 'pending' | 'transcribing' | 'generating' | 'rendering' | 'complete' | 'error'
  progress: number
  error?: string
}

interface SidebarProps {
  currentPage: 'home' | 'editor' | 'settings'
  onNavigate: (page: 'home' | 'editor' | 'settings') => void
  jobs: Job[]
  currentJobId?: string
  onSelectJob: (jobId: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

// ERROR LOG PANEL
const ErrorLogPanel: React.FC<{
  errors: string[]
  onClear: () => void
}> = ({ errors, onClear }) => {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  if (errors.length === 0) return null

  const handleCopy = async () => {
    const text = errors.join('\n\n---\n\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border-t border-orange-500/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-orange-500/10 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-sm font-medium text-red-400">
            {errors.length} Error{errors.length > 1 ? 's' : ''}
          </span>
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {expanded && (
        <div className="px-2 pb-2">
          <div className="flex gap-2 mb-2 px-2">
            <button
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs bg-orange-500/20 rounded hover:bg-orange-500/30 transition-colors"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy All'}
            </button>
            <button
              onClick={onClear}
              className="flex items-center justify-center gap-1 py-1.5 px-2 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              <Trash2 size={12} />
              Clear
            </button>
          </div>

          <div className="max-h-48 overflow-auto space-y-2">
            {errors.map((err, i) => (
              <div
                key={i}
                className="bg-red-950/30 border border-red-500/20 rounded p-2 text-xs font-mono text-red-300 break-words"
              >
                {err}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  jobs,
  currentJobId,
  onSelectJob,
  collapsed = false,
  onToggleCollapse
}) => {
  // collect errors from jobs
  const [errorLog, setErrorLog] = useState<string[]>([])
  
  useEffect(() => {
    const newErrors = jobs
      .filter(j => j.error && !errorLog.includes(j.error))
      .map(j => j.error!)
    
    if (newErrors.length > 0) {
      setErrorLog(prev => [...prev, ...newErrors])
    }
  }, [jobs])

  const clearErrors = () => setErrorLog([])

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'transcribing':
      case 'generating':
      case 'rendering':
        return <Loader2 size={14} className="animate-spin text-orange-400" />
      case 'complete':
        return <CheckCircle size={14} className="text-green-500" />
      case 'error':
        return <XCircle size={14} className="text-red-500" />
      default:
        return <Film size={14} className="text-gray-400" />
    }
  }

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'transcribing': return 'Transcribing...'
      case 'generating': return 'Generating...'
      case 'rendering': return 'Rendering...'
      case 'complete': return 'Done!'
      case 'error': return 'Failed'
      default: return 'Ready'
    }
  }

  return (
    <div className={clsx(
      'h-full bg-[#1a1a1a] border-r border-orange-500/20 flex flex-col transition-all duration-200',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* nav */}
      <nav className="py-4 space-y-1">
        <button
          onClick={() => onNavigate('home')}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-3 transition-colors',
            currentPage === 'home'
              ? 'bg-orange-500/20 text-orange-400 border-r-2 border-orange-500'
              : 'text-gray-400 hover:bg-orange-500/10 hover:text-white'
          )}
        >
          <Home size={20} />
          {!collapsed && <span className="font-medium">Home</span>}
        </button>
        <button
          onClick={() => onNavigate('settings')}
          className={clsx(
            'w-full flex items-center gap-3 px-4 py-3 transition-colors',
            currentPage === 'settings'
              ? 'bg-orange-500/20 text-orange-400 border-r-2 border-orange-500'
              : 'text-gray-400 hover:bg-orange-500/10 hover:text-white'
          )}
        >
          <Settings size={20} />
          {!collapsed && <span className="font-medium">Settings</span>}
        </button>
      </nav>

      {/* job list */}
      {!collapsed && (
        <div className="flex-1 overflow-auto border-t border-orange-500/20">
          <div className="px-4 py-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Your Projects
            </h3>
          </div>
          
          {jobs.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500">No projects yet.</p>
              <p className="text-xs text-gray-600 mt-1">Pick a style to start!</p>
            </div>
          ) : (
            <div className="px-2 space-y-1">
              {jobs.map(job => (
                <button
                  key={job.id}
                  onClick={() => onSelectJob(job.id)}
                  className={clsx(
                    'w-full text-left p-3 rounded-lg transition-colors',
                    currentJobId === job.id
                      ? 'bg-orange-500/20 border border-orange-500/30'
                      : 'hover:bg-orange-500/10'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(job.status)}
                    <span className="text-sm font-medium text-white truncate">
                      {job.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{job.mode}</span>
                    <span className="text-xs text-orange-400">{getStatusText(job.status)}</span>
                  </div>
                  {/* progress bar for active jobs */}
                  {['transcribing', 'generating', 'rendering'].includes(job.status) && (
                    <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* spacer */}
      <div className="flex-1" />

      {/* error log */}
      {!collapsed && <ErrorLogPanel errors={errorLog} onClear={clearErrors} />}

      {/* collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="p-4 border-t border-orange-500/20 text-gray-500 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </div>
  )
}
