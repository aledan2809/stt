# STT Module - Speech-to-Text for Romanian Medical Dictation

## Overview
Generic, reusable Speech-to-Text module with native Romanian support, designed for medical/dental professionals. Supports multiple STT providers with on-premise deployment for GDPR compliance.

## Key Features
- **Multi-provider support**: Switch between Whisper (self-hosted), Vatis Tech, Deepgram, OpenAI, Azure, Google Cloud
- **Romanian-first**: Optimized for Romanian language with diacritics support
- **Medical/Dental domain**: Custom vocabulary, terminology correction, SOAP note templates
- **On-premise deployment**: Zero data leaves client infrastructure
- **Real-time + Batch**: Live transcription and file upload
- **GDPR compliant**: Encrypted credentials, audit logs, configurable audio retention

## Target Users
- Medical doctors (dictating patient reports)
- Dentists (hands-free documentation during procedures)

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, WebSocket (Socket.io/ws)
- **Database**: SQLite via Prisma ORM
- **STT Engines**: faster-whisper (local), API providers (configurable)
- **Audio**: ffmpeg, MediaRecorder API, VAD (Voice Activity Detection)
- **Post-processing**: Claude/OpenAI API for medical terminology correction

## Quick Start

### Prerequisites
- Node.js 18+
- ffmpeg installed
- (Optional) Python 3.10+ with CUDA for local Whisper

### Installation
```bash
cd D:\Projects\STT
npm install
npx prisma generate
npx prisma db push
```

### Development
```bash
npm run dev
```
Open http://localhost:3000

### Configuration
1. Go to Settings (/settings)
2. Select STT Provider
3. Enter API key (encrypted automatically)
4. Test connection
5. Start dictating!

## Project Structure
```
D:\Projects\STT\
├── src/
│   ├── app/                 # Next.js pages (App Router)
│   ├── lib/                 # Core logic (STT providers, audio pipeline)
│   ├── components/          # React components
│   └── types/               # TypeScript types
├── prisma/                  # Database schema
├── knowledge/               # Specifications and research
├── docker-compose.yml       # Production deployment
└── whisper/                 # Self-hosted Whisper server (Python)
```

## Roadmap
- **Phase 1 (MVP)**: Dictation + transcription with provider selection
- **Phase 2**: Templates, SOAP notes, PDF export
- **Phase 3**: Real-time streaming transcription
- **Phase 4**: Docker deployment, production hardening

## Documentation
- [Technical Specifications](knowledge/TECHNICAL-SPECS.md)
- [Provider Research](knowledge/STT-RESEARCH-REPORT.md)
- [Strategy](STRATEGY.md)
- [Development Status](DEVELOPMENT_STATUS.md)

## License
Proprietary - On-premise deployment for clients

## Support
Contact: [To be added]
