# TERRY - Simple Video Editor

The simple automated video editor. Drop a video, pick a style, get a professionally edited result.

## Features

- **Dead Simple**: Upload → Pick Style → Export
- **6 Video Modes**: Documentary, TikTok, Tutorial, Beat History, Chill Essay, Cinematic
- **AI-Powered**: Claude picks the edits, Whisper transcribes
- **GPU Rendering**: Fast Remotion rendering

## Quick Start

```bash
# run the appimage directly
./release/Terry-1.0.0.AppImage

# or for development
npm install
npm run dev
```

## How to Use

1. **Open Terry** - Click the AppImage
2. **Pick a style** - Choose from the home screen
3. **Drop your video** - Or click to browse
4. **Wait a bit** - Terry does the rest
5. **Export** - Get your finished video

## Video Modes

| Mode | Vibe |
|------|------|
| Documentary | Clean, professional, cinematic |
| TikTok | Fast, engaging, vertical-friendly |
| Tutorial | Clear, educational, step-by-step |
| Beat History | Dramatic, true crime style |
| Chill Essay | Relaxed, thoughtful, essay vibes |
| Cinematic | Film-like, atmospheric |

## Requirements

- **Claude API Key**: Get from [Anthropic](https://console.anthropic.com)
- Set your API key in Settings

## Development

```bash
npm run dev              # run electron + vite
npm run remotion:preview # preview compositions  
npm run build            # build for production
npm run package:linux    # create AppImage
```

## vs HITS

Terry is the simpler version:
- **HITS**: Plugin-based, extensible, more control
- **Terry**: Simple, just works, minimal setup

Use Terry if you want quick edits without configuration.
Use HITS if you want to customize effects and add plugins.
