// WHISPER SERVICE - transcribes video/audio
// supports: OpenAI whisper CLI (python), whisper.cpp, or OpenAI API

import * as fs from 'fs'
import * as path from 'path'
import { spawn, exec } from 'child_process'
import { app } from 'electron'
import https from 'https'

export interface Word {
  word: string
  start: number
  end: number
}

export interface TranscriptSegment {
  id: number
  start: number
  end: number
  text: string
  words: Word[]
}

export interface TranscriptResult {
  segments: TranscriptSegment[]
  text: string
  language: string
  duration: number
}

export interface WhisperModel {
  name: string
  size: string
  downloaded: boolean
}

const WHISPER_MODELS = ['tiny', 'base', 'small', 'medium', 'large-v3']

function getModelsDir(): string {
  const userDataPath = app?.getPath('userData') || path.join(process.env.HOME || '', '.terry')
  const modelsDir = path.join(userDataPath, 'whisper-models')
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true })
  }
  return modelsDir
}

export function isModelDownloaded(model: string): boolean {
  const modelsDir = getModelsDir()
  return fs.existsSync(path.join(modelsDir, `ggml-${model}.bin`))
}

export function listModels(): WhisperModel[] {
  const modelsDir = getModelsDir()
  const sizes: Record<string, string> = {
    'tiny': '75 MB', 'base': '142 MB', 'small': '466 MB',
    'medium': '1.5 GB', 'large-v3': '3.1 GB'
  }
  return WHISPER_MODELS.map(name => ({
    name,
    size: sizes[name] || '?',
    downloaded: fs.existsSync(path.join(modelsDir, `ggml-${name}.bin`))
  }))
}

export async function downloadModel(
  model: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const modelsDir = getModelsDir()
  const modelFile = path.join(modelsDir, `ggml-${model}.bin`)

  if (fs.existsSync(modelFile)) return modelFile

  const url = `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${model}.bin`
  console.log('[whisper] downloading:', url)

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(modelFile)

    const download = (downloadUrl: string) => {
      https.get(downloadUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          download(res.headers.location!)
          return
        }

        const total = parseInt(res.headers['content-length'] || '0', 10)
        let downloaded = 0

        res.on('data', (chunk: Buffer) => {
          downloaded += chunk.length
          if (total > 0 && onProgress) onProgress((downloaded / total) * 100)
        })

        res.pipe(file)
        file.on('finish', () => { file.close(); resolve(modelFile) })
        file.on('error', (e) => { fs.unlinkSync(modelFile); reject(e) })
      }).on('error', (e) => { if (fs.existsSync(modelFile)) fs.unlinkSync(modelFile); reject(e) })
    }

    download(url)
  })
}

// Try OpenAI whisper CLI (python)
async function transcribeWithWhisperCLI(
  filePath: string,
  model: string,
  onProgress?: (stage: string) => void
): Promise<TranscriptResult> {
  onProgress?.('transcribing')

  const outputDir = path.dirname(filePath)
  const baseName = path.basename(filePath, path.extname(filePath))

  return new Promise((resolve, reject) => {
    const args = [
      filePath,
      '--model', model === 'large-v3' ? 'large' : model,
      '--output_dir', outputDir,
      '--output_format', 'json',
      '--language', 'en'
    ]

    console.log('[whisper] running: whisper', args.join(' '))

    const proc = spawn('whisper', args)
    let stderr = ''

    proc.stderr.on('data', (d) => { stderr += d.toString(); console.log('[whisper]', d.toString()) })
    proc.stdout.on('data', (d) => console.log('[whisper]', d.toString()))

    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`whisper failed: ${stderr}`))

      const jsonPath = path.join(outputDir, baseName + '.json')
      try {
        if (fs.existsSync(jsonPath)) {
          resolve(parseJson(JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))))
        } else {
          reject(new Error('no output file'))
        }
      } catch (e) { reject(e) }
    })

    proc.on('error', (err) => reject(new Error(`whisper not found: ${err.message}`)))
  })
}

// Try whisper.cpp
async function transcribeWithWhisperCpp(
  filePath: string,
  model: string,
  onProgress?: (stage: string) => void
): Promise<TranscriptResult> {
  const modelsDir = getModelsDir()
  const modelFile = path.join(modelsDir, `ggml-${model}.bin`)

  if (!fs.existsSync(modelFile)) throw new Error(`Model not downloaded`)

  onProgress?.('transcribing')

  const outputDir = path.dirname(filePath)
  const baseName = path.basename(filePath, path.extname(filePath))
  const outFile = path.join(outputDir, baseName)

  const whisperCmd = await findWhisperCppCmd()
  if (!whisperCmd) throw new Error('whisper.cpp not found')

  return new Promise((resolve, reject) => {
    const args = ['-m', modelFile, '-f', filePath, '-of', outFile, '-oj', '-l', 'en']
    const proc = spawn(whisperCmd, args)
    let stderr = ''

    proc.stderr.on('data', d => stderr += d.toString())
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`whisper.cpp failed: ${stderr}`))

      const jsonPath = outFile + '.json'
      const srtPath = outFile + '.srt'

      try {
        if (fs.existsSync(jsonPath)) {
          resolve(parseJson(JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))))
        } else if (fs.existsSync(srtPath)) {
          resolve(parseSrt(fs.readFileSync(srtPath, 'utf-8')))
        } else {
          reject(new Error('no output'))
        }
      } catch (e) { reject(e) }
    })
    proc.on('error', reject)
  })
}

// OpenAI API
async function transcribeOpenAI(
  filePath: string,
  apiKey: string,
  onProgress?: (stage: string) => void
): Promise<TranscriptResult> {
  onProgress?.('uploading to OpenAI')

  const FormData = (await import('form-data')).default
  const form = new FormData()
  form.append('file', fs.createReadStream(filePath))
  form.append('model', 'whisper-1')
  form.append('response_format', 'verbose_json')
  form.append('timestamp_granularities[]', 'word')

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/audio/transcriptions',
      method: 'POST',
      headers: { ...form.getHeaders(), 'Authorization': `Bearer ${apiKey}` }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(data)
          if (json.error) return reject(new Error(json.error.message))
          resolve(parseOpenAI(json))
        } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    form.pipe(req)
  })
}

async function findWhisperCppCmd(): Promise<string | null> {
  for (const cmd of ['whisper-cpp', 'whisper.cpp', 'main']) {
    try {
      await new Promise((res, rej) => exec(`which ${cmd}`, e => e ? rej(e) : res(true)))
      return cmd
    } catch { continue }
  }
  return null
}

// Main transcribe function
export async function transcribe(
  filePath: string,
  model: string = 'small',
  onProgress?: (stage: string) => void,
  openaiKey?: string
): Promise<TranscriptResult> {
  console.log('[whisper] starting:', filePath)
  console.log('[whisper] model:', model)

  // Method 1: OpenAI whisper CLI (python)
  try {
    return await transcribeWithWhisperCLI(filePath, model, onProgress)
  } catch (err) {
    console.warn('[whisper] CLI failed:', err)
  }

  // Method 2: whisper.cpp
  if (isModelDownloaded(model)) {
    try {
      return await transcribeWithWhisperCpp(filePath, model, onProgress)
    } catch (err) {
      console.warn('[whisper] cpp failed:', err)
    }
  }

  // Method 3: OpenAI API
  if (openaiKey) {
    return await transcribeOpenAI(filePath, openaiKey, onProgress)
  }

  throw new Error('Transcription failed. Install whisper: pip install openai-whisper')
}

function parseOpenAI(json: any): TranscriptResult {
  const segments: TranscriptSegment[] = []
  for (const seg of (json.segments || [])) {
    segments.push({
      id: segments.length,
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
      words: (json.words || [])
        .filter((w: any) => w.start >= seg.start && w.end <= seg.end)
        .map((w: any) => ({ word: w.word, start: w.start, end: w.end }))
    })
  }
  return {
    segments,
    text: json.text || '',
    language: json.language || 'en',
    duration: segments.length > 0 ? segments[segments.length - 1].end : 0
  }
}

function parseJson(json: any): TranscriptResult {
  const segments: TranscriptSegment[] = []
  let fullText = ''
  let maxEnd = 0

  for (let i = 0; i < (json.segments?.length || 0); i++) {
    const seg = json.segments[i]
    segments.push({
      id: i, start: seg.start, end: seg.end,
      text: (seg.text || '').trim(),
      words: (seg.words || []).map((w: any) => ({ word: w.word || w.text, start: w.start, end: w.end }))
    })
    fullText += (seg.text || '').trim() + ' '
    if (seg.end > maxEnd) maxEnd = seg.end
  }
  return { segments, text: fullText.trim(), language: json.language || 'en', duration: maxEnd }
}

function parseSrt(srt: string): TranscriptResult {
  const segments: TranscriptSegment[] = []
  let fullText = ''
  let maxEnd = 0

  for (const block of srt.trim().split(/\n\n+/)) {
    const lines = block.split('\n')
    if (lines.length < 3) continue
    const m = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
    if (!m) continue
    const start = +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000
    const end = +m[5]*3600 + +m[6]*60 + +m[7] + +m[8]/1000
    const text = lines.slice(2).join(' ').trim()
    segments.push({ id: segments.length, start, end, text, words: [] })
    fullText += text + ' '
    if (end > maxEnd) maxEnd = end
  }
  return { segments, text: fullText.trim(), language: 'en', duration: maxEnd }
}
