// HOME PAGE - mode selection and file upload
// super simple - pick style, drop file

import React, { useState } from 'react'
import { Film, Upload, Zap, MonitorPlay, Smartphone, Square, Check } from 'lucide-react'
import clsx from 'clsx'

const modes = [
  { id: 'lemmino', name: 'LEMMiNO', desc: 'Smooth documentary style', hits: '~20/min', gradient: 'mode-lemmino' },
  { id: 'mrbeast', name: 'MrBeast', desc: 'High energy with SFX', hits: '~40/min', gradient: 'mode-mrbeast' },
  { id: 'tiktok', name: 'TikTok', desc: 'Rapid fire edits', hits: '~55/min', gradient: 'mode-tiktok' },
  { id: 'documentary', name: 'Documentary', desc: 'Classic B-roll style', hits: '~15/min', gradient: 'mode-documentary' },
  { id: 'tutorial', name: 'Tutorial', desc: 'Clean educational', hits: '~12/min', gradient: 'mode-tutorial' },
]

const formats = [
  { id: 'horizontal', icon: MonitorPlay, label: '16:9', desc: 'YouTube' },
  { id: 'vertical', icon: Smartphone, label: '9:16', desc: 'TikTok' },
  { id: 'square', icon: Square, label: '1:1', desc: 'Instagram' },
]

interface HomePageProps {
  selectedMode: string | null
  onModeSelect: (mode: string) => void
  onFileSelect: (file: string) => void
}

export const HomePage: React.FC<HomePageProps> = ({ selectedMode, onModeSelect, onFileSelect }) => {
  const [format, setFormat] = useState('horizontal')
  const [dragActive, setDragActive] = useState(false)

  const handleFileClick = async () => {
    const file = await window.api.dialog.openFile()
    if (file) onFileSelect(file)
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      {/* header */}
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold mb-3 text-terry-text">
          Make Videos Look Good
        </h1>
        <p className="text-terry-muted text-lg">
          Drop a video, pick a style, get an edited video. That's it.
        </p>
      </div>

      {/* step 1 - pick style */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-terry-accent text-white flex items-center justify-center text-sm font-semibold">
            1
          </div>
          <h2 className="font-semibold text-lg">Pick a Style</h2>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
              className={clsx(
                'card p-4 text-left transition-all hover:shadow-medium group relative',
                selectedMode === mode.id && 'ring-2 ring-terry-accent'
              )}
            >
              {selectedMode === mode.id && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-terry-accent flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg ${mode.gradient} flex items-center justify-center mb-3`}>
                <Film size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{mode.name}</h3>
              <p className="text-xs text-terry-muted mb-2">{mode.desc}</p>
              <div className="flex items-center gap-1 text-xs text-terry-accent">
                <Zap size={10} />
                {mode.hits}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* step 2 - format */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-terry-accent text-white flex items-center justify-center text-sm font-semibold">
            2
          </div>
          <h2 className="font-semibold text-lg">Choose Format</h2>
        </div>
        <div className="flex gap-3">
          {formats.map((f) => {
            const Icon = f.icon
            return (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                className={clsx(
                  'flex items-center gap-3 px-5 py-3 rounded-xl border transition-all',
                  format === f.id
                    ? 'border-terry-accent bg-terry-accent/5 text-terry-accent'
                    : 'border-terry-border bg-white hover:border-terry-accent/50'
                )}
              >
                <Icon size={20} />
                <div className="text-left">
                  <div className="font-medium">{f.label}</div>
                  <div className="text-xs text-terry-muted">{f.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* step 3 - drop file */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-full bg-terry-accent text-white flex items-center justify-center text-sm font-semibold">
            3
          </div>
          <h2 className="font-semibold text-lg">Drop Your Video</h2>
        </div>
        <div
          className={clsx(
            'drop-zone',
            dragActive && 'active',
            !selectedMode && 'opacity-50 pointer-events-none'
          )}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFileClick() }}
          onClick={handleFileClick}
        >
          <Upload size={48} className="text-terry-muted" />
          <div className="text-center">
            <p className="font-medium text-lg mb-1">Drop your video here</p>
            <p className="text-terry-muted">or click to browse</p>
            <p className="text-xs text-terry-muted mt-2">MP4, MOV, MKV, MP3, WAV</p>
          </div>
        </div>
        {!selectedMode && (
          <p className="text-center text-terry-muted text-sm mt-3">
            Pick a style first
          </p>
        )}
      </section>
    </div>
  )
}

