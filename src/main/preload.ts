// PRELOAD SCRIPT - bridge between electron and react
// keeps things secure by only exposing what we need

import { contextBridge, ipcRenderer } from 'electron'

export interface TerryAPI {
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<boolean>
    close: () => Promise<void>
  }
  config: {
    get: (key: string) => Promise<any>
    set: (key: string, value: any) => Promise<void>
    getAll: () => Promise<Record<string, any>>
  }
  dialog: {
    openFile: () => Promise<string | null>
    openFiles: () => Promise<string[]>
    openDirectory: () => Promise<string | null>
    saveFile: (name: string) => Promise<string | null>
  }
  modes: {
    getAll: () => Promise<Record<string, any>>
  }
  whisper: {
    transcribe: (filePath: string) => Promise<{ success: boolean; data?: any; error?: string }>
    listModels: () => Promise<any[]>
    isDownloaded: (model: string) => Promise<boolean>
    downloadModel: (model: string) => Promise<{ success: boolean; path?: string; error?: string }>
    onProgress: (callback: (data: any) => void) => () => void
    onDownloadProgress: (callback: (data: any) => void) => () => void
  }
  claude: {
    generate: (transcript: any, mode: string, sourceVideo: string, aspectRatio?: string) => Promise<{ success: boolean; data?: any; error?: string }>
  }
  render: {
    start: (manifest: any, outputPath: string) => Promise<{ success: boolean; error?: string }>
    onProgress: (callback: (data: any) => void) => () => void
  }
  shell: {
    openExternal: (url: string) => Promise<void>
    showItem: (path: string) => Promise<void>
  }
  folder: {
    listMedia: (folderPath: string) => Promise<string[]>
  }
  transcode: {
    needsConvert: (filePath: string) => Promise<boolean>
    isFFmpegInstalled: () => Promise<boolean>
    convert: (filePath: string) => Promise<{ success: boolean; outputPath: string; error?: string }>
    onProgress: (callback: (data: any) => void) => () => void
  }
}

const api: TerryAPI = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  config: {
    get: (key) => ipcRenderer.invoke('config:get', key),
    set: (key, value) => ipcRenderer.invoke('config:set', key, value),
    getAll: () => ipcRenderer.invoke('config:getAll'),
  },
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    saveFile: (name) => ipcRenderer.invoke('dialog:saveFile', name),
  },
  modes: {
    getAll: () => ipcRenderer.invoke('modes:getAll'),
  },
  whisper: {
    transcribe: (filePath) => ipcRenderer.invoke('whisper:transcribe', filePath),
    listModels: () => ipcRenderer.invoke('whisper:listModels'),
    isDownloaded: (model) => ipcRenderer.invoke('whisper:isDownloaded', model),
    downloadModel: (model) => ipcRenderer.invoke('whisper:downloadModel', model),
    onProgress: (callback) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('whisper:progress', handler)
      return () => ipcRenderer.removeListener('whisper:progress', handler)
    },
    onDownloadProgress: (callback) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('whisper:downloadProgress', handler)
      return () => ipcRenderer.removeListener('whisper:downloadProgress', handler)
    },
  },
  claude: {
    generate: (transcript, mode, sourceVideo, aspectRatio) => 
      ipcRenderer.invoke('claude:generate', transcript, mode, sourceVideo, aspectRatio),
  },
  render: {
    start: (manifest, outputPath) => ipcRenderer.invoke('render:start', manifest, outputPath),
    onProgress: (callback) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('render:progress', handler)
      return () => ipcRenderer.removeListener('render:progress', handler)
    },
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
    showItem: (path) => ipcRenderer.invoke('shell:showItem', path),
  },
  folder: {
    listMedia: (folderPath) => ipcRenderer.invoke('folder:listMedia', folderPath),
  },
  transcode: {
    needsConvert: (filePath) => ipcRenderer.invoke('transcode:needsConvert', filePath),
    isFFmpegInstalled: () => ipcRenderer.invoke('transcode:isFFmpegInstalled'),
    convert: (filePath) => ipcRenderer.invoke('transcode:convert', filePath),
    onProgress: (callback) => {
      const handler = (_: any, data: any) => callback(data)
      ipcRenderer.on('transcode:progress', handler)
      return () => ipcRenderer.removeListener('transcode:progress', handler)
    },
  },
}

contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api: TerryAPI
  }
}
