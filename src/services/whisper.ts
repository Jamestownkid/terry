// WHISPER SERVICE - transcribes video/audio
// same as hits but simplified for terry

import { nodewhisper } from 'nodejs-whisper'
import * as fs from 'fs'
import * as path from 'path'

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

export async function transcribe(
  filePath: string,
  model: string = 'large-v3',
  onProgress?: (stage: string) => void
): Promise<TranscriptResult> {
  console.log('[whisper] starting:', filePath)
  onProgress?.('loading')

  const outputDir = path.dirname(filePath)
  const baseName = path.basename(filePath, path.extname(filePath))

  await nodewhisper(filePath, {
    modelName: model,
    autoDownloadModelName: model,
    removeWavFileAfterTranscription: false,
    withCuda: true,
    whisperOptions: {
      outputInText: false,
      outputInVtt: false,
      outputInSrt: true,
      outputInCsv: false,
      translateToEnglish: false,
      wordTimestamps: true,
      language: 'auto',
      splitOnWord: true
    }
  })

  onProgress?.('parsing')

  const jsonPath = path.join(outputDir, baseName + '.json')
  const srtPath = path.join(outputDir, baseName + '.srt')

  if (fs.existsSync(jsonPath)) {
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    return parseJson(json)
  } else if (fs.existsSync(srtPath)) {
    const srt = fs.readFileSync(srtPath, 'utf-8')
    return parseSrt(srt)
  }

  throw new Error('no transcription output')
}

function parseJson(json: any): TranscriptResult {
  const segments: TranscriptSegment[] = []
  let fullText = ''
  let maxEnd = 0

  for (let i = 0; i < (json.segments?.length || 0); i++) {
    const seg = json.segments[i]
    segments.push({
      id: i,
      start: seg.start,
      end: seg.end,
      text: (seg.text || '').trim(),
      words: (seg.words || []).map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end
      }))
    })
    fullText += (seg.text || '').trim() + ' '
    if (seg.end > maxEnd) maxEnd = seg.end
  }

  return { segments, text: fullText.trim(), language: json.language || 'en', duration: maxEnd }
}

function parseSrt(srt: string): TranscriptResult {
  const segments: TranscriptSegment[] = []
  const blocks = srt.trim().split(/\n\n+/)
  let fullText = ''
  let maxEnd = 0

  for (const block of blocks) {
    const lines = block.split('\n')
    if (lines.length < 3) continue

    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
    if (!timeMatch) continue

    const start = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000
    const end = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000
    const text = lines.slice(2).join(' ').trim()

    segments.push({ id: segments.length, start, end, text, words: [] })
    fullText += text + ' '
    if (end > maxEnd) maxEnd = end
  }

  return { segments, text: fullText.trim(), language: 'en', duration: maxEnd }
}

