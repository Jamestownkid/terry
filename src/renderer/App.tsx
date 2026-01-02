// TERRY APP - simple video editor
// pick a file, pick a style, get a video
// NOW WITH SIDEBAR for job tracking like HITS!!
// AUTO-CONVERTS MOV/HEVC to H.264 MP4!

import React, { useState, useCallback, useEffect } from 'react'
import { TitleBar } from './components/TitleBar'
import { Sidebar } from './components/Sidebar'
import { HomePage } from './pages/HomePage'
import { EditorPage } from './pages/EditorPage'
import { SettingsPage } from './pages/SettingsPage'
import { ConvertingOverlay } from './components/ConvertingOverlay'
import { JobInfo } from './components/JobPanel'

type Page = 'home' | 'editor' | 'settings'

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home')
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<string | null>(null)
  
  // JOB TRACKING - keeps track of all running jobs
  const [jobs, setJobs] = useState<JobInfo[]>([])
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  
  // CONVERTING STATE
  const [isConverting, setIsConverting] = useState(false)
  const [convertProgress, setConvertProgress] = useState(0)

  // listen for transcode progress
  useEffect(() => {
    const cleanup = window.api.transcode.onProgress((data) => {
      setConvertProgress(data.percent || 0)
    })
    return cleanup
  }, [])

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode)
  }

  // FILE SELECT - auto-converts MOV/HEVC to H.264 MP4
  const handleFileSelect = async (file: string) => {
    let finalFile = file
    
    // check if file needs transcoding
    const needsConvert = await window.api.transcode.needsConvert(file)
    
    if (needsConvert) {
      const hasFFmpeg = await window.api.transcode.isFFmpegInstalled()
      if (hasFFmpeg) {
        setIsConverting(true)
        setConvertProgress(0)
        
        try {
          const result = await window.api.transcode.convert(file)
          if (result.success) {
            finalFile = result.outputPath
            console.log('[transcode] using converted file:', finalFile)
          }
        } catch (err) {
          console.error('[transcode] error:', err)
        } finally {
          setIsConverting(false)
        }
      }
    }
    
    // create job with final file
    const jobId = crypto.randomUUID()
    const fileName = file.split('/').pop() || 'Untitled'
    
    const newJob: JobInfo = {
      id: jobId,
      name: fileName,
      mode: selectedMode || 'unknown',
      sourceFile: finalFile,
      status: 'transcribing',
      progress: 0,
    }
    
    setJobs(prev => [...prev, newJob])
    setCurrentJobId(jobId)
    setSourceFile(finalFile)
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
      {/* Converting overlay */}
      {isConverting && <ConvertingOverlay progress={convertProgress} />}
      
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

