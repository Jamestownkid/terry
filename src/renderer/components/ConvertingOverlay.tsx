// CONVERTING OVERLAY - shows when transcoding MOV to MP4
// can't miss it - big spinner right in the middle

import React from 'react'

interface ConvertingOverlayProps {
  progress: number
}

export const ConvertingOverlay: React.FC<ConvertingOverlayProps> = ({ progress }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-terry-surface border border-terry-border rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Big spinner */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-terry-border" />
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="url(#grad)" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${progress * 2.89} 289`} className="transition-all duration-1000" />
            <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient></defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl">🔄</span>
            <span className="text-xl font-bold text-terry-accent">{Math.round(progress)}%</span>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-bold text-terry-text mb-1">Converting Video</h3>
          <p className="text-terry-muted text-sm mb-4">
            Optimizing for Linux playback...
          </p>
          <p className="text-xs text-terry-muted">
            MOV/HEVC → H.264 MP4
          </p>
        </div>
        
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-terry-muted">Processing...</span>
        </div>
      </div>
    </div>
  )
}

