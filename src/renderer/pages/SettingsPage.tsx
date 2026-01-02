// SETTINGS PAGE - simple config with whisper model management
import React, { useState, useEffect } from 'react'
import { Key, FolderOpen, Save, CheckCircle, ArrowLeft, Download, Loader2, Cpu } from 'lucide-react'

interface SettingsPageProps {
  onBack: () => void
}

interface WhisperModel {
  name: string
  size: string
  downloaded: boolean
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')
  const [whisperModel, setWhisperModel] = useState('medium')
  const [assetsDir, setAssetsDir] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [saved, setSaved] = useState(false)
  const [models, setModels] = useState<WhisperModel[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)

  useEffect(() => {
    const load = async () => {
      const config = await window.api.config.getAll()
      setApiKey(config.anthropicApiKey || '')
      setOpenaiKey(config.openaiApiKey || '')
      setWhisperModel(config.whisperModel || 'medium')
      setAssetsDir(config.assetsDir || '')
      setAspectRatio(config.aspectRatio || '16:9')
      
      const modelList = await window.api.whisper.listModels()
      setModels(modelList)
    }
    load()

    const unsubscribe = window.api.whisper.onDownloadProgress((data) => {
      setDownloadProgress(data.percent)
      if (data.percent >= 100) {
        setDownloading(null)
        window.api.whisper.listModels().then(setModels)
      }
    })
    return () => unsubscribe()
  }, [])

  const handleSave = async () => {
    await window.api.config.set('anthropicApiKey', apiKey)
    await window.api.config.set('openaiApiKey', openaiKey)
    await window.api.config.set('whisperModel', whisperModel)
    await window.api.config.set('assetsDir', assetsDir)
    await window.api.config.set('aspectRatio', aspectRatio)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDownload = async (model: string) => {
    setDownloading(model)
    setDownloadProgress(0)
    const result = await window.api.whisper.downloadModel(model)
    if (!result.success) alert(`Failed: ${result.error}`)
    setDownloading(null)
    const modelList = await window.api.whisper.listModels()
    setModels(modelList)
  }

  const handleSelectAssets = async () => {
    const dir = await window.api.dialog.openDirectory()
    if (dir) setAssetsDir(dir)
  }

  return (
    <div className="max-w-xl mx-auto px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="btn-ghost p-2">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
      </div>

      {/* API keys */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Key size={18} className="text-forge-accent" />
          API Keys
        </h2>
        
        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">Claude API Key (Required)</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="input"
          />
          <p className="text-xs text-forge-muted mt-1">
            Get from <button onClick={() => window.api.shell.openExternal('https://console.anthropic.com')} className="text-forge-accent hover:underline">console.anthropic.com</button>
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">OpenAI API Key (Optional fallback)</label>
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-..."
            className="input"
          />
          <p className="text-xs text-forge-muted mt-1">
            Optional: Used for Whisper API if local model fails
          </p>
        </div>
      </div>

      {/* Whisper models */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Cpu size={18} className="text-forge-accent" />
          Whisper Model
        </h2>

        <div className="mb-4">
          <select
            value={whisperModel}
            onChange={(e) => setWhisperModel(e.target.value)}
            className="input"
          >
            {models.map((m) => (
              <option key={m.name} value={m.name} disabled={!m.downloaded}>
                {m.name} ({m.size}) {m.downloaded ? '✓' : '- download first'}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {models.map((m) => (
            <div key={m.name} className="flex items-center justify-between bg-forge-bg rounded-lg p-3">
              <div>
                <span className="font-medium">{m.name}</span>
                <span className="text-forge-muted ml-2 text-sm">{m.size}</span>
              </div>
              {m.downloaded ? (
                <span className="text-forge-success text-sm flex items-center gap-1">
                  <CheckCircle size={14} /> Ready
                </span>
              ) : downloading === m.name ? (
                <div className="flex items-center gap-2 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  {downloadProgress.toFixed(0)}%
                </div>
              ) : (
                <button onClick={() => handleDownload(m.name)} className="btn-secondary text-xs py-1">
                  <Download size={12} /> Download
                </button>
              )}
            </div>
          ))}
        </div>
        
        <p className="text-xs text-forge-muted mt-3">
          💡 Start with "medium" - good balance of speed and quality
        </p>
      </div>

      {/* Aspect ratio */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4">Default Aspect Ratio</h2>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: '16:9', label: '16:9', desc: 'YouTube' },
            { value: '9:16', label: '9:16', desc: 'TikTok' },
            { value: '1:1', label: '1:1', desc: 'Square' },
            { value: '4:3', label: '4:3', desc: 'Classic' },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => setAspectRatio(r.value)}
              className={`p-2 rounded-lg border-2 transition-all ${
                aspectRatio === r.value
                  ? 'border-forge-accent bg-forge-accent/10'
                  : 'border-forge-border hover:border-forge-accent/50'
              }`}
            >
              <div className="font-bold text-sm">{r.label}</div>
              <div className="text-xs text-forge-muted">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* assets */}
      <div className="card mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FolderOpen size={18} className="text-forge-accent" />
          Sound Effects
        </h2>
        <div className="flex gap-2">
          <input type="text" value={assetsDir} readOnly placeholder="Select folder with sfx/" className="input flex-1" />
          <button onClick={handleSelectAssets} className="btn-secondary">Browse</button>
        </div>
        <p className="text-xs text-forge-muted mt-2">Point to the AUDIO folder for sound effects</p>
      </div>

      {/* save */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="flex items-center gap-2 text-forge-success">
            <CheckCircle size={16} /> Saved
          </span>
        )}
        <button onClick={handleSave} className="btn-primary">
          <Save size={16} /> Save Settings
        </button>
      </div>
    </div>
  )
}
