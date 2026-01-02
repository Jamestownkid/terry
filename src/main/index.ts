// TERRY - Electron Main Process
// simple and clean - just works

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import Store from 'electron-store'
import { transcribe, listModels, downloadModel, isModelDownloaded } from '../services/whisper'
import { generateManifest, VIDEO_MODES } from '../services/claude'
import { render, RenderProgress } from '../services/render'
import { glob } from 'glob'

const store = new Store({
  defaults: {
    anthropicApiKey: '',
    openaiApiKey: '',
    whisperModel: 'small',  // small is best balance
    outputDir: path.join(app.getPath('documents'), 'Terry', 'output'),
    assetsDir: '',
    aspectRatio: '16:9'
  }
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    backgroundColor: '#faf7f5',
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5174')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  console.log('[terry] starting up')
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize())
ipcMain.handle('window:maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize()
  return mainWindow?.isMaximized()
})
ipcMain.handle('window:close', () => mainWindow?.close())

// config
ipcMain.handle('config:get', (_, key) => store.get(key))
ipcMain.handle('config:set', (_, key, value) => store.set(key, value))
ipcMain.handle('config:getAll', () => store.store)

// dialogs
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'mp3', 'wav', 'ogg', 'aac', 'flac'] }]
  })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'webm', 'mp3', 'wav'] }]
  })
  return result.canceled ? [] : result.filePaths
})

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, { properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:saveFile', async (_, name) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: name,
    filters: [{ name: 'MP4', extensions: ['mp4'] }]
  })
  return result.canceled ? null : result.filePath
})

// modes
ipcMain.handle('modes:getAll', () => VIDEO_MODES)

// WHISPER MODEL MANAGEMENT
ipcMain.handle('whisper:listModels', () => listModels())
ipcMain.handle('whisper:isDownloaded', (_, model: string) => isModelDownloaded(model))

ipcMain.handle('whisper:downloadModel', async (_, model: string) => {
  // whisper downloads models automatically on first use
  mainWindow?.webContents.send('whisper:downloadProgress', { model, percent: 100 })
  return { success: true, path: model }
})

// transcribe
ipcMain.handle('whisper:transcribe', async (_, filePath) => {
  const model = store.get('whisperModel') as string
  const openaiKey = store.get('openaiApiKey') as string
  
  mainWindow?.webContents.send('whisper:progress', { stage: 'starting' })
  
  try {
    const result = await transcribe(filePath, model, (stage) => {
      mainWindow?.webContents.send('whisper:progress', { stage })
    }, openaiKey)
    mainWindow?.webContents.send('whisper:progress', { stage: 'complete' })
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

// generate manifest
ipcMain.handle('claude:generate', async (_, transcript, mode, sourceVideo, aspectRatio) => {
  const apiKey = store.get('anthropicApiKey') as string
  if (!apiKey) return { success: false, error: 'Claude API key not set' }

  try {
    const assetsDir = store.get('assetsDir') as string
    const sfxDir = assetsDir ? path.join(assetsDir, 'sfx') : ''
    const sfxFiles = sfxDir && fs.existsSync(sfxDir)
      ? await glob('**/*.mp3', { cwd: sfxDir })
      : []

    const manifest = await generateManifest(apiKey, transcript, mode, sourceVideo, sfxFiles)
    
    // apply aspect ratio
    const ratio = aspectRatio || store.get('aspectRatio') || '16:9'
    if (ratio === '9:16') {
      manifest.width = 1080
      manifest.height = 1920
    } else if (ratio === '1:1') {
      manifest.width = 1080
      manifest.height = 1080
    } else if (ratio === '4:3') {
      manifest.width = 1440
      manifest.height = 1080
    }
    
    return { success: true, data: manifest }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

// render
ipcMain.handle('render:start', async (_, manifest, outputPath) => {
  try {
    await render(manifest, outputPath, (progress) => {
      mainWindow?.webContents.send('render:progress', progress)
    })
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

// shell
ipcMain.handle('shell:openExternal', (_, url) => shell.openExternal(url))
ipcMain.handle('shell:showItem', (_, filePath) => shell.showItemInFolder(filePath))

// list files in folder (batch processing)
ipcMain.handle('folder:listMedia', async (_, folderPath: string) => {
  if (!fs.existsSync(folderPath)) return []
  const exts = ['mp4', 'mov', 'mkv', 'webm', 'avi', 'mp3', 'wav', 'ogg']
  return fs.readdirSync(folderPath)
    .filter(f => exts.includes(f.split('.').pop()?.toLowerCase() || ''))
    .map(f => path.join(folderPath, f))
})
