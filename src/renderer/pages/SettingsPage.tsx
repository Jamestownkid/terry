// SETTINGS PAGE - simple config
import React, { useState, useEffect } from 'react'
import { Key, FolderOpen, Save, CheckCircle, ArrowLeft } from 'lucide-react'

interface SettingsPageProps {
  onBack: () => void
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState('')
  const [assetsDir, setAssetsDir] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const config = await window.api.config.getAll()
      setApiKey(config.anthropicApiKey || '')
      setAssetsDir(config.assetsDir || '')
    }
    load()
  }, [])

  const handleSave = async () => {
    await window.api.config.set('anthropicApiKey', apiKey)
    await window.api.config.set('assetsDir', assetsDir)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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

      {/* API key */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Key size={18} className="text-terry-accent" />
          Claude API Key
        </h2>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="input"
        />
        <p className="text-xs text-terry-muted mt-2">
          Get your key from{' '}
          <button
            onClick={() => window.api.shell.openExternal('https://console.anthropic.com')}
            className="text-terry-accent hover:underline"
          >
            console.anthropic.com
          </button>
        </p>
      </div>

      {/* assets */}
      <div className="card mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <FolderOpen size={18} className="text-terry-accent" />
          Sound Effects
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={assetsDir}
            readOnly
            placeholder="Select folder with sfx/"
            className="input flex-1"
          />
          <button onClick={handleSelectAssets} className="btn-secondary">
            Browse
          </button>
        </div>
        <p className="text-xs text-terry-muted mt-2">
          Point to the AUDIO folder for sound effects
        </p>
      </div>

      {/* save */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="flex items-center gap-2 text-terry-success">
            <CheckCircle size={16} />
            Saved
          </span>
        )}
        <button onClick={handleSave} className="btn-primary">
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  )
}

