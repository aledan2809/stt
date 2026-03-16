# CHANGELOG.md - STT Module

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project bootstrap
- MASTER governance system files (SESSION_BOOT, README, STRATEGY, CONTEXT, DECISIONS, GUARDRAILS, CHANGELOG)
- Knowledge base documentation (STT-RESEARCH-REPORT.md, TECHNICAL-SPECS.md)

## [0.1.0] - 2026-03-12 - MVP Phase 1 Bootstrap

### Added
- Next.js 14 project structure with App Router
- Prisma ORM setup with SQLite database
- STT Provider abstraction layer (interface + manager)
- OpenAI Whisper API provider implementation
- Deepgram API provider implementation
- Vatis Tech API provider implementation
- POST /api/transcribe endpoint (batch upload)
- Recorder page with MediaRecorder API
- Dashboard page with transcription history
- Settings page with provider selection and API key management
- Credential encryption (AES-256)
- shadcn/ui component library integration
- Tailwind CSS styling
- TypeScript strict mode configuration

### Database Schema
- `Setting` model: Key-value config with encryption support
- `Transcription` model: Audio metadata + transcript + provider info
- `Report` model: Structured medical reports (stub for Phase 2)
- `Template` model: SOAP note templates (stub for Phase 2)
- `CustomVocabulary` model: Medical term dictionary (stub for Phase 2)

### Documentation
- README.md: Project overview and quick start
- STRATEGY.md: Product vision, technical strategy, roadmap
- CONTEXT.md: Architecture context, patterns, data flows
- DECISIONS.md: All architectural and technical decisions
- GUARDRAILS.md: Security, GDPR, scope constraints
- DEVELOPMENT_STATUS.md: Current state tracking

### Configuration
- `.env.example`: Template for required environment variables
- `tsconfig.json`: TypeScript strict configuration
- `tailwind.config.ts`: Tailwind CSS with shadcn/ui preset
- `prisma/schema.prisma`: Complete database schema

### Dependencies
- next: ^14.0.0
- react: ^18.0.0
- prisma: ^5.0.0
- @prisma/client: ^5.0.0
- tailwindcss: ^3.4.0
- shadcn/ui components
- zod: Input validation
- openai: OpenAI API client
- @deepgram/sdk: Deepgram API client

## [0.0.0] - 2026-03-12 - Project Initialization

### Added
- Project directory structure at D:\Projects\STT
- Knowledge folder with complete specifications
- Git repository initialization (if applicable)

---

## Upcoming (Phase 2 - Templates & Reports)
- [ ] SOAP note template system
- [ ] LLM post-processing pipeline (diacritics, medical correction)
- [ ] Report CRUD with rich text editor
- [ ] PDF/DOCX export
- [ ] Custom vocabulary management
- [ ] Audio playback with text synchronization

## Upcoming (Phase 3 - Real-time Streaming)
- [ ] WebSocket server for audio streaming
- [ ] Live transcription display
- [ ] VAD (Voice Activity Detection) integration
- [ ] Waveform visualization
- [ ] Speaker diarization

## Upcoming (Phase 4 - Production)
- [ ] Docker Compose deployment
- [ ] Self-hosted Whisper server (Python FastAPI)
- [ ] GPU support for Whisper
- [ ] GDPR compliance checklist
- [ ] Audit logging
- [ ] Bulk operations
- [ ] User documentation

---

## Version History

**Versioning Scheme**:
- MAJOR: Breaking changes, incompatible API changes
- MINOR: New features, backwards-compatible
- PATCH: Bug fixes, backwards-compatible

**Current Version**: 0.1.0 (MVP Phase 1 Bootstrap)
**Target Version**: 1.0.0 (Phase 4 complete, production-ready)

---

## Notes
- All Phase 1 features focused on batch transcription only
- No real-time streaming in MVP (deferred to Phase 3)
- No post-processing in MVP (raw STT output only)
- Single-user deployment (no auth required)
- Manual npm installation (Docker in Phase 4)
