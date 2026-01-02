// TITLE BAR - clean and simple
// added new project button so u can start fresh

import React from 'react'
import { Minus, Square, X, ArrowLeft, Settings, Plus } from 'lucide-react'

interface TitleBarProps {
  onSettings: () => void
  onBack?: () => void
  showBack: boolean
  onNewProject?: () => void
}

export const TitleBar: React.FC<TitleBarProps> = ({ onSettings, onBack, showBack, onNewProject }) => {
  return (
    <div className="h-12 bg-white border-b border-terry-border flex items-center justify-between px-4 drag-region">
      <div className="flex items-center gap-3 no-drag">
        {showBack && onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-terry-bg text-terry-muted hover:text-terry-text transition-colors"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="w-8 h-8 rounded-lg bg-terry-accent flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <span className="font-display font-semibold">Terry</span>
      </div>

      <div className="flex items-center gap-1 no-drag">
        {/* NEW PROJECT - prominent button */}
        {onNewProject && (
          <button
            onClick={onNewProject}
            className="px-3 py-1.5 mr-2 rounded-lg bg-terry-accent text-white hover:bg-terry-accent-bright transition-colors flex items-center gap-1 text-sm font-medium"
            title="Start new project"
          >
            <Plus size={16} />
            New
          </button>
        )}
        <button
          onClick={onSettings}
          className="p-2 rounded-lg bg-terry-bg border border-terry-border hover:bg-terry-hover text-terry-text transition-colors"
          title="Settings"
        >
          <Settings size={18} />
        </button>
        <button
          onClick={() => window.api.window.minimize()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-terry-bg text-terry-muted hover:text-terry-text transition-colors"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => window.api.window.maximize()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-terry-bg text-terry-muted hover:text-terry-text transition-colors"
        >
          <Square size={12} />
        </button>
        <button
          onClick={() => window.api.window.close()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-terry-error text-terry-muted hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

