// TERRY APP - simple video editor
// pick a file, pick a style, get a video
// NOW WITH SIDEBAR for job tracking like HITS!!

import React, { useState, useCallback } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { HomePage } from './pages/HomePage'
import { EditorPage } from './pages/EditorPage'
import { SettingsPage } from './pages/SettingsPage'
import { JobInfo } from './components/JobPanel'

type Page = 'home' | 'editor' | 'settings'

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home')
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<string | null>(null)
  
  // JOB TRACKING - keeps track of all running jobs
  const [jobs, setJobs] = useState<JobInfo[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode)
  }

  const handleFileSelect = (file: string) => {
    const jobId = crypto.randomUUID()
    const fileName = file.split('/').pop() || 'Untitled'
    
    const newJob: JobInfo = {
      id: jobId,
      name: fileName,
      mode: selectedMode || 'unknown',
      sourceFile: file,
      status: 'transcribing',
      progress: 0,
    }
    
    setJobs(prev => [...prev, newJob])
    setCurrentJobId(jobId)
    setSourceFile(file)
    setPage('editor')
  }

  const updateJob = useCallback((jobId: string, updates: Partial<JobInfo>) => {
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, ...updates } : j
    ))
  }, [])

  const handleSelectJob = (job: JobInfo) => {
    setCurrentJobId(job.id)
    setSelectedMode(job.mode)
    setSourceFile(job.sourceFile)
    setPage('editor')
  }

  const handleBack = () => {
    setPage('home')
  }

  const handleNewProject = () => {
    setSelectedMode(null)
    setSourceFile(null)
    setCurrentJobId(null)
    setPage('home')
  }

  const currentJob = jobs.find(j => j.id === currentJobId)

  return (
    <div className="h-screen w-screen flex flex-col bg-terry-bg text-terry-text overflow-hidden">
      <TitleBar 
        onSettings={() => setPage('settings')}
        onBack={page !== 'home' ? handleBack : undefined}
        showBack={page !== 'home'}
        onNewProject={handleNewProject}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR - shows all jobs on the left */}
        <Sidebar
          jobs={jobs}
          currentJobId={currentJobId || undefined}
          onSelectJob={handleSelectJob}
          onHome={() => setPage('home')}
          onSettings={() => setPage('settings')}
          currentPage={page}
        />

        {/* main content */}
        <main className="flex-1 overflow-auto">
          {/* Home page */}
          <div className={page === 'home' ? '' : 'hidden'}>
            <HomePage
              selectedMode={selectedMode}
              onModeSelect={handleModeSelect}
              onFileSelect={handleFileSelect}
            />
          </div>

          {/* Editor page */}
          {sourceFile && selectedMode && currentJobId && (
            <div className={page === 'editor' ? '' : 'hidden'}>
              <EditorPage
                sourceFile={sourceFile}
                mode={selectedMode}
                onBack={handleBack}
                jobId={currentJobId}
                job={currentJob}
                onUpdateJob={(updates) => updateJob(currentJobId, updates)}
              />
            </div>
          )}

          {/* Settings page */}
          <div className={page === 'settings' ? '' : 'hidden'}>
            <SettingsPage onBack={() => setPage(sourceFile ? 'editor' : 'home')} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App

