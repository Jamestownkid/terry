// TERRY - Electron Main Process
// simple and clean - just works

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import Store from 'electron-store'
import { transcribe } from '../services/whisper'
import { generateManifest, VIDEO_MODES } from '../services/claude'
import { render, RenderProgress } from '../services/render'
import { glob } from 'glob'

const store = new Store({
  defaults: {
    anthropicApiKey: '',
    whisperModel: 'large-v3',
    outputDir: path.join(app.getPath('documents'), 'Terry', 'output'),
    assetsDir: ''
  }
})

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    backgroundColor: '#faf7f5',
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
    filters: [{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'webm', 'mp3', 'wav'] }]
  })
  return result.canceled ? null : result.filePaths[0]
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

// transcribe
ipcMain.handle('whisper:transcribe', async (_, filePath) => {
  const model = store.get('whisperModel') as string
  mainWindow?.webContents.send('whisper:progress', { stage: 'starting' })
  
  try {
    const result = await transcribe(filePath, model, (stage) => {
      mainWindow?.webContents.send('whisper:progress', { stage })
    })
    mainWindow?.webContents.send('whisper:progress', { stage: 'complete' })
    return { success: true, data: result }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

// generate manifest
ipcMain.handle('claude:generate', async (_, transcript, mode, sourceVideo) => {
  const apiKey = store.get('anthropicApiKey') as string
  if (!apiKey) return { success: false, error: 'no API key' }

  try {
    const assetsDir = store.get('assetsDir') as string
    const sfxDir = assetsDir ? path.join(assetsDir, 'sfx') : ''
    const sfxFiles = sfxDir && fs.existsSync(sfxDir) 
      ? await glob('**/*.mp3', { cwd: sfxDir })
      : []

    const manifest = await generateManifest(apiKey, transcript, mode, sourceVideo, sfxFiles)
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

