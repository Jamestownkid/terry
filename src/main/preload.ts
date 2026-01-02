// PRELOAD - exposes APIs to renderer
import { contextBridge, ipcRenderer } from 'electron'

const api = {
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
  },
  config: {
    get: (key: string) => ipcRenderer.invoke('config:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('config:set', key, value),
    getAll: () => ipcRenderer.invoke('config:getAll'),
  },
  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    saveFile: (name: string) => ipcRenderer.invoke('dialog:saveFile', name),
  },
  modes: {
    getAll: () => ipcRenderer.invoke('modes:getAll'),
  },
  whisper: {
    transcribe: (path: string) => ipcRenderer.invoke('whisper:transcribe', path),
    onProgress: (cb: (data: any) => void) => {
      const handler = (_: any, data: any) => cb(data)
      ipcRenderer.on('whisper:progress', handler)
      return () => ipcRenderer.removeListener('whisper:progress', handler)
    },
  },
  claude: {
    generate: (transcript: any, mode: string, video: string) =>
      ipcRenderer.invoke('claude:generate', transcript, mode, video),
  },
  render: {
    start: (manifest: any, output: string) => ipcRenderer.invoke('render:start', manifest, output),
    onProgress: (cb: (data: any) => void) => {
      const handler = (_: any, data: any) => cb(data)
      ipcRenderer.on('render:progress', handler)
      return () => ipcRenderer.removeListener('render:progress', handler)
    },
  },
  shell: {
    openExternal: (url: string) => ipcRenderer.invoke('shell:openExternal', url),
    showItem: (path: string) => ipcRenderer.invoke('shell:showItem', path),
  },
}

contextBridge.exposeInMainWorld('api', api)

declare global {
  interface Window {
    api: typeof api
  }
}

