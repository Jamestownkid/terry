// TERRY APP - simple video editor
// pick a file, pick a style, get a video

import React, { useState, useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { HomePage } from './pages/HomePage'
import { EditorPage } from './pages/EditorPage'
import { SettingsPage } from './pages/SettingsPage'

type Page = 'home' | 'editor' | 'settings'

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home')
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<string | null>(null)

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode)
  }

  const handleFileSelect = (file: string) => {
    setSourceFile(file)
    setPage('editor')
  }

  const handleBack = () => {
    setPage('home')
    setSelectedMode(null)
    setSourceFile(null)
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-terry-bg text-terry-text overflow-hidden">
      <TitleBar 
        onSettings={() => setPage('settings')}
        onBack={page !== 'home' ? handleBack : undefined}
        showBack={page !== 'home'}
      />

      <main className="flex-1 overflow-auto">
        {/* Home page */}
        <div className={page === 'home' ? '' : 'hidden'}>
          <HomePage
            selectedMode={selectedMode}
            onModeSelect={handleModeSelect}
            onFileSelect={handleFileSelect}
          />
        </div>

        {/* Editor page - keep mounted to preserve state */}
        {sourceFile && selectedMode && (
          <div className={page === 'editor' ? '' : 'hidden'}>
            <EditorPage
              sourceFile={sourceFile}
              mode={selectedMode}
              onBack={handleBack}
            />
          </div>
        )}

        {/* Settings page */}
        <div className={page === 'settings' ? '' : 'hidden'}>
          <SettingsPage onBack={() => setPage(sourceFile ? 'editor' : 'home')} />
        </div>
      </main>
    </div>
  )
}

export default App

