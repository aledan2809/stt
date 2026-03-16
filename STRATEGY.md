# STRATEGY.md - STT Module

## Product Vision
Build a production-ready, on-premise Speech-to-Text solution for Romanian medical professionals that prioritizes:
1. **Privacy**: Zero data leaves client infrastructure (GDPR by design)
2. **Flexibility**: Multiple STT providers, user-selectable from UI
3. **Accuracy**: Romanian-optimized with medical terminology support
4. **Simplicity**: Docker deployment, minimal IT overhead

## Market Position
- **Primary market**: Romanian medical/dental clinics
- **Differentiator**: On-premise + Romanian optimization + provider flexibility
- **Competition**: Dragon Medical (expensive, cloud-based), Alta AI (US-focused)

## Technical Strategy

### Architecture Decisions
1. **Monolithic Next.js**: App + API in one codebase for MVP simplicity
2. **Provider abstraction**: Abstract class pattern allows seamless provider swap
3. **SQLite**: Simplest DB for on-premise, single-user MVP
4. **Docker**: Deployment vehicle for on-premise installations
5. **Self-hosted Whisper**: Zero cost per minute, GDPR compliant

### Provider Selection Strategy
**MVP Priority Order**:
1. OpenAI Whisper API - easiest integration, test provider
2. Deepgram - best price/performance, $200 free credit
3. Vatis Tech - best Romanian accuracy, local company
4. Whisper Local - zero cost, full privacy (Phase 2)

**User Choice**: Provider selectable from Settings UI with live testing

### Data Strategy
- **Audio storage**: Configurable (keep/delete after transcription)
- **Credentials**: AES-256 encrypted in SQLite
- **Audit logs**: WHO accessed WHAT WHEN (GDPR requirement)
- **Backups**: User-managed (on-premise responsibility)

### Post-Processing Strategy
**Phase 1**: Raw STT output only
**Phase 2**: LLM-based pipeline
  1. Diacritics restoration (if provider doesn't provide)
  2. Medical terminology correction (Claude/OpenAI)
  3. SOAP note structuring
  4. NER (medication, diagnoses extraction)

### Deployment Strategy
**MVP**: Manual installation (npm install, prisma setup, npm run dev)
**Phase 4**: Docker Compose one-command deployment
  - stt-app container (Next.js)
  - whisper-server container (Python FastAPI + faster-whisper)
  - GPU passthrough for Whisper acceleration

## Business Model (Future)
- **Licensing**: Per-clinic perpetual license
- **Support**: Annual support contract
- **Custom training**: Fine-tuned Whisper models for specific clinics

## Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Provider API changes break integration | High | Abstraction layer isolates breaking changes |
| Self-hosted Whisper too slow on CPU | Medium | Recommend GPU, fallback to API providers |
| Audio files fill disk | Medium | Auto-delete configuration, size alerts |
| SQLite concurrent writes | Low | Single-user MVP, PostgreSQL upgrade path |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Medical professionals resistant to AI | High | Emphasize "assistant", doctor remains in control |
| GDPR compliance challenges | Critical | On-premise + audit logs + encryption by default |
| Vendor lock-in fears | Medium | Multi-provider support addresses this |

## Success Metrics (Phase 1 MVP)
- [ ] Doctor can dictate 5-minute report and get accurate transcript in <30 seconds
- [ ] Provider swap works seamlessly from Settings UI
- [ ] Romanian diacritics preserved correctly in output
- [ ] Zero crashes during 1-hour dictation session
- [ ] API keys stored encrypted, not plaintext

## Development Principles
1. **Knowledge-first**: All decisions derived from knowledge/ folder specs
2. **Governance checkpoints**: DEVELOPMENT_STATUS.md updated after each major milestone
3. **No assumptions**: If spec unclear, clarify before implementing
4. **MVP ruthlessness**: Defer Phase 2+ features aggressively
5. **Provider abstraction first**: Most critical pattern, implement before UI

## Phase Boundaries

### Phase 1: MVP Core (THIS SESSION)
- Recorder page + upload
- POST /api/transcribe (batch only)
- Settings with provider selection
- 3 API providers working (OpenAI, Deepgram, Vatis Tech)
- Dashboard with transcription history
- Raw STT output (no post-processing)

### Phase 2: Templates & Reports (FUTURE)
- SOAP note templates
- LLM post-processing
- PDF export
- Custom vocabulary

### Phase 3: Real-time (FUTURE)
- WebSocket streaming
- Live transcription display
- VAD integration

### Phase 4: Production (FUTURE)
- Docker deployment
- GPU Whisper server
- GDPR compliance checklist
- Documentation

## Exit Criteria for This Session
- All Phase 1 MVP items functional
- Project builds and runs
- At least 1 provider (OpenAI Whisper) working end-to-end
- Settings UI functional
- DEVELOPMENT_STATUS.md reflects accurate current state
