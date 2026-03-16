# DECISIONS.md - STT Module

## Architectural Decisions

### AD-001: Next.js 14 App Router (2026-03-12)
**Status**: Accepted
**Context**: Need unified frontend + backend, modern React patterns
**Decision**: Use Next.js 14 with App Router (not Pages Router)
**Rationale**:
- Server Components reduce client bundle size
- Built-in API routes eliminate need for separate backend
- App Router is current Next.js direction (Pages Router maintenance mode)
- Easy Docker deployment
**Consequences**:
- (+) Unified codebase, single deployment
- (+) Server-side rendering for better performance
- (-) WebSocket requires custom server or library (not built-in)
- (-) App Router learning curve if team knows Pages Router

### AD-002: Provider Abstraction Layer (2026-03-12)
**Status**: Accepted - CRITICAL PATTERN
**Context**: Must support multiple STT providers, user-selectable
**Decision**: Abstract class `STTProvider` with concrete implementations per provider
**Rationale**:
- Explicit requirement: "provider selectabil din Settings UI"
- Strategy pattern allows runtime provider switching
- Easy to add new providers without changing UI
- Testability - mock provider for unit tests
**Consequences**:
- (+) Zero vendor lock-in
- (+) Seamless provider swap from Settings
- (+) Easy to add new providers (implement interface, register)
- (-) Slight complexity overhead vs hardcoding one provider
**Alternatives Considered**:
- Hardcode single provider: REJECTED (violates core requirement)
- Provider factory pattern: POSSIBLE, but abstract class more explicit

### AD-003: SQLite for MVP (2026-03-12)
**Status**: Accepted
**Context**: Need database for on-premise deployment, single-user MVP
**Decision**: SQLite via Prisma ORM
**Rationale**:
- Zero configuration (file-based)
- Perfect for single-user on-premise
- Prisma makes PostgreSQL migration trivial later
- No separate DB server to manage
**Consequences**:
- (+) Simplest on-premise deployment
- (+) Zero config, zero network overhead
- (-) Poor concurrent write performance (OK for single user)
- (-) No built-in replication/backup (user responsibility)
**Migration Path**: If multi-user needed, switch Prisma datasource to PostgreSQL, re-run migrations

### AD-004: Batch Transcription First (2026-03-12)
**Status**: Accepted
**Context**: MVP scope - real-time streaming vs batch upload
**Decision**: Phase 1 MVP = batch only (upload file, get transcript). Streaming in Phase 3.
**Rationale**:
- Simpler implementation (REST API vs WebSocket)
- All providers support batch (not all support streaming)
- Sufficient for MVP validation
- Streaming adds complexity (chunking, buffering, VAD)
**Consequences**:
- (+) Faster MVP delivery
- (+) Works with all providers immediately
- (-) Not "wow factor" of live transcription
- (-) User waits for full transcription (acceptable for short files)

### AD-005: Credential Encryption (2026-03-12)
**Status**: Accepted
**Context**: API keys must be stored securely (GDPR, security best practice)
**Decision**: AES-256 encrypt API keys in SQLite, decrypt on use
**Rationale**:
- GDPR requires secure credential storage
- Medical context = higher security bar
- SQLite files could be copied/stolen
**Consequences**:
- (+) API keys not plaintext in DB
- (+) Meets GDPR encryption-at-rest requirement
- (-) Need encryption key management (env var or system secret)
- (-) Slight performance overhead (negligible)
**Implementation**: Node.js `crypto` module, encryption key from env var `ENCRYPTION_KEY`

### AD-006: Provider Priority for MVP (2026-03-12)
**Status**: Accepted
**Context**: Must implement at least 2-3 providers for MVP, which ones?
**Decision**:
1. OpenAI Whisper API (first - easiest integration)
2. Deepgram (second - best price/performance)
3. Vatis Tech (third - best Romanian accuracy)
4. Whisper Local (Phase 2 - requires Python server)
**Rationale**:
- OpenAI: Simplest API, most developers have key already, good for testing
- Deepgram: $200 free credit, excellent Romanian support, WebSocket ready
- Vatis Tech: Romanian company, best accuracy per research report, local support
- Whisper Local: Zero cost but requires Python setup (defer to Phase 2)
**Consequences**:
- (+) MVP has 3 providers = demonstrates flexibility
- (+) OpenAI validates pattern quickly
- (+) Deepgram ready for streaming (Phase 3)
- (-) Whisper Local (zero cost option) not in Phase 1

### AD-007: No Post-Processing in Phase 1 (2026-03-12)
**Status**: Accepted
**Context**: Specs include LLM post-processing pipeline (diacritics, medical correction)
**Decision**: Phase 1 MVP = raw STT output only. Post-processing in Phase 2.
**Rationale**:
- MVP validation: does STT work? is provider swap smooth?
- Post-processing adds LLM API dependency + complexity
- Can be added incrementally (pipeline pattern)
- Vatis Tech and Deepgram already produce good quality output
**Consequences**:
- (+) Faster MVP
- (+) Fewer dependencies (no Claude/OpenAI API required yet)
- (-) Raw output may have diacritics errors
- (-) No medical term correction (doctor must fix manually)
**Phase 2**: Implement pipeline with Claude/OpenAI for correction

### AD-008: ffmpeg for Audio Conversion (2026-03-12)
**Status**: Accepted
**Context**: Browser MediaRecorder produces WebM, STT providers expect WAV
**Decision**: Use ffmpeg via child_process to convert audio server-side
**Rationale**:
- Industry standard for audio manipulation
- Already required for Whisper local (Phase 2)
- Handles all formats (WebM, MP3, M4A -> WAV 16kHz mono)
- Fast and reliable
**Consequences**:
- (+) Universal audio format support
- (+) Normalize to provider requirements (16kHz mono PCM)
- (-) External dependency (must be installed on server)
- (-) Synchronous processing (blocking, but fast for short files)
**Alternative Considered**:
- Web Audio API client-side conversion: POSSIBLE but complex, doesn't help for file uploads

### AD-009: Prisma Schema Design (2026-03-12)
**Status**: Accepted
**Context**: Database models for transcriptions, reports, settings, templates
**Decision**: Use schema from TECHNICAL-SPECS.md as-is
**Rationale**:
- Spec provides complete, well-thought-out schema
- Covers all MVP + future phases
- Relationships clear (Report has many Transcriptions)
**Consequences**:
- (+) No schema design needed (already done)
- (+) Future-proof (includes template, vocabulary models)
- (-) Some models unused in Phase 1 (Template, Report - implement in Phase 2)
**Phase 1 Models**: Setting, Transcription only. Phase 2: Report, Template, CustomVocabulary.

### AD-010: shadcn/ui for Components (2026-03-12)
**Status**: Accepted
**Context**: Need UI component library, spec recommends shadcn/ui
**Decision**: Use shadcn/ui + Tailwind CSS
**Rationale**:
- Spec explicitly mentions it
- Copy-paste components (not npm package) = full control
- Built on Radix UI (accessible, composable)
- Tailwind CSS native (consistent styling)
**Consequences**:
- (+) Beautiful, accessible components out of box
- (+) Full control (components in codebase, not node_modules)
- (+) Easy customization
- (-) Manual component installation (npx shadcn-ui add button)
**Components Needed Phase 1**: Button, Input, Textarea, Select, Card, Dialog, Toast

## Technical Decisions

### TD-001: TypeScript Strict Mode (2026-03-12)
**Status**: Accepted
**Decision**: Enable TypeScript strict mode
**Rationale**: Medical software = correctness critical, strict types prevent bugs
**Consequences**: (+) Catch errors at compile time, (-) Slightly slower development

### TD-002: No Authentication in Phase 1 (2026-03-12)
**Status**: Accepted
**Decision**: MVP is single-user, no login required
**Rationale**: On-premise deployment = physical access control, Phase 1 validation
**Consequences**: (+) Simpler MVP, (-) Must add in Phase 4 for multi-user

### TD-003: Audio Storage Configurable (2026-03-12)
**Status**: Accepted
**Decision**: Settings toggle: "Keep audio files after transcription" (default: delete)
**Rationale**: GDPR data minimization - only keep if explicitly needed
**Consequences**: (+) GDPR compliant by default, (-) User must enable if they want audio

### TD-004: Monorepo vs Separate Repos (2026-03-12)
**Status**: Accepted
**Decision**: Monorepo - Next.js app + Whisper Python server in one repo
**Rationale**: Simpler deployment, docker-compose in single repo
**Consequences**: (+) Unified version control, (-) Mixing Node + Python (acceptable)

## Deferred Decisions (Future Phases)

### DD-001: EHR Integration Strategy
**Status**: Deferred to post-MVP
**Context**: Future integration with clinic EHR systems
**Options**: HL7 FHIR, custom REST API per EHR vendor, file export
**Reason**: No specific EHR requirements yet, will depend on client needs

### DD-002: Multi-User Architecture
**Status**: Deferred to Phase 4+
**Context**: Auth, roles, patient assignment
**Options**: Next-Auth, Clerk, custom JWT
**Reason**: MVP is single-user validation

### DD-003: Fine-Tuned Whisper Model
**Status**: Deferred to post-MVP
**Context**: Train custom Whisper model on client's medical audio data
**Options**: HuggingFace Transformers fine-tuning, use existing readerbench/whisper-ro
**Reason**: Requires labeled audio corpus (client must provide)

### DD-004: Mobile App
**Status**: Deferred to post-MVP
**Context**: Dictation on-the-go
**Options**: React Native, share Next.js API
**Reason**: MVP validation first, mobile if demand exists

## Questions to Revisit

### Q-001: WebSocket Library Choice (Phase 3)
**Context**: Need WebSocket for real-time streaming
**Options**:
- Socket.io (easy, well-documented)
- ws (lightweight, raw WebSocket)
- Next.js custom server (more control)
**Decision Date**: When starting Phase 3 implementation

### Q-002: Whisper Model Size for Local
**Context**: Whisper comes in tiny, base, small, medium, large, large-v3
**Trade-off**: Accuracy vs speed vs VRAM
**Current Recommendation**: large-v3 (best accuracy, needs 6GB VRAM)
**Decision Date**: Phase 2 when implementing Whisper local

### Q-003: Export Format Priority
**Context**: Phase 2 includes export feature
**Options**: PDF (most requested), DOCX (editable), TXT (simple), JSON (integrations)
**Decision Date**: Phase 2 kickoff, validate with users
