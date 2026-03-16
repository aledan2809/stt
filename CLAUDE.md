# CLAUDE.md - STT Module Autonomous Development

## Project Setup

### Database
- **Type**: SQLite (on-premise, file-based)
- **Connection**: See `.env` for DATABASE_URL (file:./data/stt.db)
- **ORM**: Prisma

### Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Port**: 3000 (development)
- **Language**: TypeScript (strict mode)

---

## MANDATORY RULES (ALWAYS FOLLOW)

### 1. PROJECT LOCATION
- This project is at `D:\Projects\STT\` (already created)
- All work stays within this directory

### 2. TODO LIST - ALWAYS ACTIVE
- Every session uses TodoWrite tool to track tasks
- Update TODO with every new instruction or completed work
- Mark tasks complete immediately when done
- Add new tasks as they are discovered

### 3. STATUS BACKUP (Prevent Data Loss)
**AUTO-BACKUP TRIGGERS** (Do automatically):
- After EVERY completed TODO item
- After any file creation/major edit
- After successful build/test
- Before any risky operation
- Minimum: every 30 minutes of active work

DEVELOPMENT_STATUS.md is at D:\Projects\STT\DEVELOPMENT_STATUS.md

### 4. KNOWLEDGE BASE (PRIMARY SOURCE OF TRUTH)
**CRITICAL**: All implementation decisions MUST derive from knowledge folder:
- `D:\Projects\STT\knowledge\STT-RESEARCH-REPORT.md` - Provider comparison, costs, Romanian support
- `D:\Projects\STT\knowledge\TECHNICAL-SPECS.md` - Architecture, database schema, API routes

**NEVER assume** - if spec unclear, reference knowledge files first.

### 5. MASTER CREDENTIAL REPOSITORY
**Path**: `C:\Projects\Master\credentials\stt.env`

**SYNC RULES**:
- When obtaining API keys (OpenAI, Deepgram, Vatis Tech), immediately sync to Master
- Check Master at project start for existing API keys
- Format:
```env
# Project: STT
# Last Updated: [date]
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
VATIS_TECH_API_KEY=...
```

### 6. GOVERNANCE SYSTEM (MASTER)
All 7 mandatory files created and maintained:
- SESSION_BOOT.md - Session goals and checkpoints
- README.md - Project overview
- STRATEGY.md - Product vision and technical strategy
- CONTEXT.md - Architecture context and patterns
- DECISIONS.md - All architectural decisions
- GUARDRAILS.md - Security and scope constraints
- CHANGELOG.md - Version history

---

## Claude Code Autonomy Rules

### ALWAYS DO (No Permission Needed)
- Read any file in the project
- Run `npm install`, `npm run dev`, `npm run build`
- Run `npx prisma generate`, `npx prisma db push`, `npx prisma migrate dev`
- Git operations: `status`, `diff`, `log`, `add`, `commit`
- Run linters: `npm run lint`
- Type checking: `npx tsc --noEmit`
- Update TODO list
- Update DEVELOPMENT_STATUS.md after major milestones

### NEVER DO (Violates Guardrails)
- Store API keys in plaintext (always encrypt)
- Implement Phase 2+ features in MVP (real-time streaming, post-processing, templates)
- Add multi-user/auth (single-user MVP)
- Create Docker setup (Phase 4 feature)
- Commit .env files
- Use `any` type in TypeScript

### ENVIRONMENT VARIABLES
Claude can create/update `.env` files. Required vars:
```env
DATABASE_URL=file:./data/stt.db
ENCRYPTION_KEY=<32-byte hex string>
NODE_ENV=development

# Optional - provider API keys (user-provided in Settings UI)
OPENAI_API_KEY=
DEEPGRAM_API_KEY=
VATIS_TECH_API_KEY=
```

### ERROR HANDLING
When errors occur:
1. Read full error message
2. Check relevant files (types, imports, config)
3. Fix and retry automatically (max 3 attempts)
4. If still failing, ask user

### TESTING WORKFLOW (MVP - Manual)
Before marking Phase 1 complete:
1. Run `npm run build` - must pass
2. Manual test: Upload 1-minute audio -> receive transcript
3. Manual test: Switch provider in Settings -> works seamlessly
4. Manual test: Dashboard displays transcription history

---

## CLI Quick Reference

### Prisma Commands
```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Push schema to SQLite (no migration files)
npx prisma db push

# Open Prisma Studio (DB GUI)
npx prisma studio

# Create migration (Phase 4+)
npx prisma migrate dev --name <migration_name>
```

### Next.js Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

### Audio Processing (ffmpeg required)
```bash
# Convert WebM to WAV 16kHz mono (used in /api/transcribe)
ffmpeg -i input.webm -ar 16000 -ac 1 -f wav output.wav
```

---

## Project-Specific Rules

### CRITICAL: Provider Abstraction Layer
**Most important architectural pattern**. All STT providers MUST implement `STTProvider` abstract class:
```typescript
abstract class STTProvider {
  abstract transcribe(audio: Buffer): Promise<TranscriptResult>
  abstract getCapabilities(): ProviderCapabilities
  abstract validateConfig(): Promise<{ valid: boolean; error?: string }>
}
```
Never bypass this abstraction. UI calls `sttManager.transcribe()`, manager delegates to active provider.

### Phase 1 MVP Scope (THIS SESSION)
**IN SCOPE**:
- Recorder page with MediaRecorder API (batch upload only)
- POST /api/transcribe (batch transcription)
- Settings page with provider selection + API key management
- Dashboard with transcription history
- 3 providers: OpenAI Whisper, Deepgram, Vatis Tech
- Raw STT output (no post-processing)

**OUT OF SCOPE** (do NOT implement):
- Real-time streaming (Phase 3)
- Post-processing pipeline (Phase 2)
- Templates, SOAP notes (Phase 2)
- PDF export (Phase 2)
- Docker deployment (Phase 4)
- Multi-user/auth (Phase 4)

### Security Requirements
1. **Encrypt API keys**: Use AES-256, store encrypted in `settings` table
2. **No plaintext secrets**: API keys come from Settings UI, stored encrypted
3. **Validate uploads**: Max file size 100MB, audio formats only
4. **Audio storage**: Default to delete after transcription (GDPR)

### Romanian Language Considerations
- Diacritics: ă, â, î, ș, ț - providers handle differently
- Vatis Tech: Best Romanian accuracy (97%)
- Deepgram: Good Romanian support, added May 2024
- OpenAI Whisper: Decent Romanian (~85-88%)
- Post-processing for diacritics: Phase 2 (LLM correction)

### File Structure (from TECHNICAL-SPECS.md)
```
D:\Projects\STT\
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── lib/                    # Core logic
│   │   ├── stt/                # Provider abstraction
│   │   │   ├── provider.ts     # Abstract class
│   │   │   ├── manager.ts      # Provider manager
│   │   │   └── providers/      # Concrete providers
│   │   ├── audio/              # ffmpeg, VAD
│   │   ├── db.ts               # Prisma client
│   │   └── crypto.ts           # Encryption utils
│   ├── components/             # React components
│   └── types/                  # TypeScript types
├── prisma/
│   └── schema.prisma           # Database schema (from TECHNICAL-SPECS.md)
├── knowledge/                  # Specification source
├── MASTER governance files
└── package.json
```

---

## Knowledge Base Files

### Active Knowledge (Read Before Implementation)
- `knowledge/STT-RESEARCH-REPORT.md` - Provider comparison, pricing, Romanian accuracy benchmarks
- `knowledge/TECHNICAL-SPECS.md` - Complete architecture, database schema, API routes, UI mockups

### Governance Files (Track Progress)
- `DEVELOPMENT_STATUS.md` - Current implementation state
- `DECISIONS.md` - Why we chose Next.js, SQLite, provider abstraction, etc.
- `GUARDRAILS.md` - What NOT to do (security, scope)

**IMPORTANT**: Check knowledge base before implementing any feature. Specs are comprehensive.

---

## Validation Checklist (Phase 1 MVP Complete)

- [ ] Next.js project builds without errors (`npm run build`)
- [ ] Prisma schema matches TECHNICAL-SPECS.md
- [ ] All 7 MASTER governance files present and current
- [ ] Provider abstraction layer implemented (abstract class + 3 providers)
- [ ] Settings UI: provider selection, API key input (encrypted), test connection
- [ ] Recorder page: record audio OR upload file
- [ ] POST /api/transcribe works with all 3 providers
- [ ] Dashboard displays transcription history from database
- [ ] DEVELOPMENT_STATUS.md reflects accurate current state
- [ ] Credentials synced to C:\Projects\Master\credentials\stt.env (if any)
- [ ] No Phase 2+ features accidentally implemented

---

## Common Gotchas

1. **ffmpeg not installed**: Server will fail on audio conversion. Document in README.
2. **MediaRecorder format**: Outputs WebM in Chrome, may vary per browser. Always convert server-side.
3. **WebSocket in App Router**: Not built-in, requires custom server or library (Phase 3 concern).
4. **Prisma Client**: Must run `npx prisma generate` after schema changes.
5. **API keys**: NEVER hardcode. User enters in Settings UI, stored encrypted.
6. **SQLite concurrent writes**: Not a problem for single-user MVP.
7. **Provider API changes**: Abstraction layer isolates UI from breaking changes.

---

## Emergency Procedures

### If Build Fails
1. Delete `node_modules` and `.next`: `rm -rf node_modules .next`
2. Reinstall: `npm install`
3. Regenerate Prisma: `npx prisma generate`
4. Retry build: `npm run build`

### If Prisma Errors
1. Check `prisma/schema.prisma` syntax
2. Run `npx prisma format` to auto-format
3. Run `npx prisma validate` to check for errors
4. Run `npx prisma generate` to regenerate client
5. Run `npx prisma db push` to sync schema to SQLite

### If Provider Fails
1. Check API key validity (test connection in Settings)
2. Check provider status (OpenAI status page, Deepgram status, etc.)
3. Fallback: user switches provider in Settings UI

---

## Session Exit Criteria

This session is complete when:
- [ ] All Phase 1 MVP tasks marked complete in TODO
- [ ] Project builds and runs successfully
- [ ] DEVELOPMENT_STATUS.md updated with final state
- [ ] CHANGELOG.md updated with v0.1.0 entry
- [ ] At least 1 provider (OpenAI Whisper) tested end-to-end
- [ ] README.md has accurate quick start instructions
