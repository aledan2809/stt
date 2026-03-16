# CONTEXT.md - STT Module

## Project Context
This project was bootstrapped on 2026-03-12 based on complete specifications in the `knowledge/` folder. All architectural decisions derive from:
- `STT-RESEARCH-REPORT.md` - Provider comparison, pricing, Romanian language considerations
- `TECHNICAL-SPECS.md` - Full architecture, database schema, API routes, roadmap

## Current State
**Session**: Initial bootstrap (EXPLORE preset)
**Phase**: 1 - MVP Core
**Status**: Scaffolding project structure and core abstractions

## Key Technical Context

### Why On-Premise?
- GDPR compliance for medical data (PII, health records)
- Client trust - data never leaves their infrastructure
- Regulatory requirement in Romanian healthcare

### Why Multiple Providers?
- **No vendor lock-in**: Clients can switch if provider fails/raises prices
- **Best-of-breed**: Different providers excel at different things
  - Vatis Tech: Best Romanian accuracy (97%)
  - Deepgram: Best price/performance ($0.0043/min)
  - OpenAI: Simplest integration for testing
  - Whisper Local: Zero cost, full privacy
- **Fallback strategy**: If primary fails, switch to secondary
- **Cost optimization**: Use cheapest for batch, fastest for real-time

### Why Provider Abstraction Layer?
**Most critical architectural decision**. Without it:
- Every UI component needs to know provider-specific APIs
- Provider swap requires refactoring entire app
- Testing is nightmare (tight coupling)

With abstraction:
- UI calls `sttManager.transcribe(audio)` - doesn't care which provider
- Provider swap in Settings just changes config key
- Easy to add new providers (implement interface, register)

### Database: Why SQLite?
- **On-premise simplicity**: No separate DB server to manage
- **Zero config**: File-based, no connection pooling issues
- **Sufficient for MVP**: Single user (doctor), low concurrency
- **Upgrade path**: Prisma makes PostgreSQL migration trivial if needed

### Next.js App Router: Why?
- **Unified codebase**: Frontend + API in one project
- **Server components**: Fetch data server-side, reduce client bundle
- **API routes**: RESTful endpoints without separate Express server
- **WebSocket support**: Via custom server or library integration
- **Production ready**: Vercel-optimized, but we deploy on-premise Docker

## Architecture Patterns

### Provider Pattern (Strategy Pattern)
```typescript
abstract class STTProvider {
  abstract transcribe(audio: Buffer): Promise<TranscriptResult>
}

class WhisperProvider extends STTProvider { ... }
class DeepgramProvider extends STTProvider { ... }

// Manager selects active provider
const result = await sttManager.transcribe(audio) // uses active provider
```

### Repository Pattern (Prisma)
```typescript
// Data access through Prisma client
const transcript = await prisma.transcription.create({ ... })
```

### Pipeline Pattern (Post-Processing)
```typescript
rawText
  -> restoreDiacritics()
  -> correctMedicalTerms()
  -> structureTemplate()
  -> formattedOutput
```

## Integration Points

### External APIs
- **OpenAI Whisper API**: `api.openai.com/v1/audio/transcriptions`
- **Deepgram API**: WebSocket + REST
- **Vatis Tech API**: `api.vatis.tech/v1/transcribe`
- **Azure Speech**: SDK-based
- **Google Cloud STT**: gRPC

### External Tools
- **ffmpeg**: Audio format conversion (WebM -> WAV 16kHz mono)
- **Python faster-whisper**: Self-hosted Whisper (Phase 4)

### Browser APIs
- **MediaRecorder API**: Capture microphone audio
- **WebSocket API**: Streaming audio chunks (Phase 3)
- **Web Audio API**: Noise reduction, waveform visualization (Phase 3)

## Data Flow

### Batch Transcription (Phase 1 MVP)
```
User clicks Record
  -> MediaRecorder starts
  -> Audio saved as Blob
  -> Upload to /api/transcribe (FormData)
  -> Server: Save temp file
  -> Server: ffmpeg convert to WAV
  -> Server: Call active STT provider
  -> Provider returns transcript
  -> Server: Save to DB (Transcription model)
  -> Return transcript to client
  -> Display in textarea (editable)
  -> User saves as Report (optional)
```

### Real-time Streaming (Phase 3)
```
User clicks Record
  -> MediaRecorder outputs chunks (250ms)
  -> Send chunk via WebSocket
  -> Server buffers
  -> On speech pause (VAD):
    -> Send buffer to STT provider
    -> Return partial result
    -> Client appends to live transcript
  -> Repeat until stop
  -> Final result saved to DB
```

## Security Context

### Credential Storage
- **User-provided API keys** stored in `settings` table
- **Encrypted** with AES-256 (key derived from system secret)
- **Never logged** or exposed in responses
- **Test connection** button validates without storing first

### Audio Data
- **Temporary**: Stored during processing, deleted after (configurable)
- **Permanent**: Only if user enables "Keep audio files" in Settings
- **Path**: Outside web root, not publicly accessible
- **Retention**: GDPR requires explicit consent + time limit

### GDPR Compliance
- **Audit logs**: WHO (user ID), WHAT (action), WHEN (timestamp), WHERE (file/transcript)
- **Right to erasure**: Delete transcript = delete audio + DB entry
- **Data minimization**: Don't store patient names/PII in STT module (reference ID only)
- **Encryption at rest**: SQLite file encrypted (OS-level or app-level)

## Known Constraints

### MVP Limitations (By Design)
- Single user only (no auth, no multi-tenancy)
- Batch transcription only (no real-time streaming)
- Raw STT output (no post-processing pipeline)
- Manual npm install (no Docker deployment)

### Technical Limitations
- **SQLite**: Poor concurrent write performance (ok for single user)
- **MediaRecorder**: WebM output varies by browser (need ffmpeg normalization)
- **Next.js WebSocket**: Requires custom server or library (not built-in to App Router)
- **Whisper local**: CPU-only is 10x slower than real-time (GPU recommended)

### Romanian Language Challenges
- **Diacritics**: ă, â, î, ș, ț - not all providers preserve correctly
- **Medical terms**: Require post-processing for accuracy
- **Dataset scarcity**: Limited Romanian medical speech datasets for fine-tuning

## Dependencies Context

### Critical Dependencies
- `next` - Framework
- `react` - UI library
- `@prisma/client` - Database ORM
- `prisma` - DB migrations
- `tailwindcss` - Styling
- `shadcn/ui` - Component library
- `zod` - Validation
- `ffmpeg` (system) - Audio conversion

### Provider SDKs (install as needed)
- `openai` - OpenAI Whisper API
- `@deepgram/sdk` - Deepgram API
- `microsoft-cognitiveservices-speech-sdk` - Azure Speech
- `@google-cloud/speech` - Google Cloud STT

## Future Integration Context (Not MVP)
- **EHR systems**: HL7 FHIR integration for patient data
- **CRM**: Sync reports to clinic management software
- **Analytics**: Usage tracking, cost per provider, accuracy trends
- **Multi-user**: Auth, roles (doctor/nurse/admin), patient assignment

## Questions Resolved
1. **Q**: Which STT provider to use?
   **A**: Multiple, user-selectable. Start with OpenAI (easiest), add Deepgram and Vatis Tech.

2. **Q**: Streaming or batch first?
   **A**: Batch (Phase 1 MVP), streaming later (Phase 3)

3. **Q**: Database choice?
   **A**: SQLite for MVP simplicity, PostgreSQL upgrade path exists

4. **Q**: Deployment model?
   **A**: On-premise Docker (Phase 4), manual npm for MVP

5. **Q**: GDPR compliance?
   **A**: On-premise deployment + encrypted credentials + audit logs + configurable retention

## Reference Links
- Next.js App Router: https://nextjs.org/docs/app
- Prisma ORM: https://www.prisma.io/docs
- OpenAI Whisper API: https://platform.openai.com/docs/guides/speech-to-text
- Deepgram API: https://developers.deepgram.com/
- Vatis Tech API: https://vatis.tech/documentation
- faster-whisper: https://github.com/SYSTRAN/faster-whisper
