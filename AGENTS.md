# AGENTS.md - STT Module (Codex CLI Support)

## Project Overview
Speech-to-Text module for Romanian medical dictation with multi-provider support (Whisper, Deepgram, Vatis Tech). On-premise deployment, Next.js 14 + Prisma + SQLite.

## Agent Guidance

### Tech Stack
- **Framework**: Next.js 14 (App Router), React 18, TypeScript (strict)
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: SQLite via Prisma ORM
- **Audio**: ffmpeg, MediaRecorder API
- **Providers**: OpenAI Whisper API, Deepgram, Vatis Tech (APIs), faster-whisper (local, Phase 4)

### Project Structure
```
src/
  app/              # Next.js pages (App Router)
  lib/              # Core logic (STT providers, audio pipeline)
    stt/            # Provider abstraction layer (CRITICAL)
    audio/          # Audio processing
  components/       # React components
  types/            # TypeScript types
prisma/             # Database schema
knowledge/          # Specification docs (SOURCE OF TRUTH)
```

### Critical Patterns

#### 1. Provider Abstraction (MOST IMPORTANT)
All STT providers implement `STTProvider` abstract class. UI never calls providers directly.
```typescript
// lib/stt/provider.ts - Abstract class
// lib/stt/manager.ts - Manages active provider
// lib/stt/providers/*.ts - Concrete implementations
```

#### 2. Credential Encryption
API keys stored encrypted (AES-256) in `settings` table, never plaintext.

#### 3. GDPR Compliance
- Audio files configurable retention (default: delete after transcription)
- Audit logs required (WHO accessed WHAT WHEN)
- No PII stored directly (reference IDs only)

### Knowledge Base (READ FIRST)
- `knowledge/TECHNICAL-SPECS.md` - Complete architecture, database schema, API routes
- `knowledge/STT-RESEARCH-REPORT.md` - Provider comparison, Romanian language considerations

### Governance Files
- `STRATEGY.md` - Product vision, technical strategy, roadmap
- `DECISIONS.md` - Why we chose Next.js, provider abstraction, SQLite, etc.
- `GUARDRAILS.md` - Security constraints, scope control (Phase 1 MVP only)
- `DEVELOPMENT_STATUS.md` - Current implementation state

### Current Phase: MVP Phase 1
**IN SCOPE**:
- Batch transcription (upload audio file)
- Provider selection from Settings UI
- 3 API providers: OpenAI, Deepgram, Vatis Tech
- Dashboard with history
- Raw STT output (no post-processing)

**OUT OF SCOPE** (do NOT implement):
- Real-time streaming (Phase 3)
- Post-processing/LLM correction (Phase 2)
- Templates, SOAP notes (Phase 2)
- Docker deployment (Phase 4)
- Multi-user/auth (Phase 4)

### Key Commands
```bash
# Development
npm run dev

# Database
npx prisma generate        # After schema changes
npx prisma db push         # Sync schema to SQLite
npx prisma studio          # DB GUI

# Build
npm run build
npx tsc --noEmit          # Type check
```

### Common Tasks

#### Add New STT Provider
1. Create `src/lib/stt/providers/new-provider.ts`
2. Extend `STTProvider` abstract class
3. Implement: `transcribe()`, `getCapabilities()`, `validateConfig()`
4. Register in `src/lib/stt/manager.ts`
5. Add UI in Settings page

#### Add New API Route
1. Create `src/app/api/[route]/route.ts`
2. Export `POST`, `GET`, `PUT`, `DELETE` as needed
3. Use Prisma for database operations (`lib/db.ts`)
4. Return `NextResponse.json()`

#### Add New Page
1. Create `src/app/[page]/page.tsx`
2. Use Server Components by default
3. Client Components: add `"use client"` directive
4. Import shadcn/ui components from `@/components/ui`

### Dependencies
```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "prisma": "^5.0.0",
  "@prisma/client": "^5.0.0",
  "openai": "^4.0.0",
  "@deepgram/sdk": "^3.0.0",
  "zod": "^3.22.0"
}
```

### Environment Variables
```env
DATABASE_URL=file:./data/stt.db
ENCRYPTION_KEY=<32-byte hex>
NODE_ENV=development

# Optional (user configures via Settings UI)
OPENAI_API_KEY=
DEEPGRAM_API_KEY=
VATIS_TECH_API_KEY=
```

### Validation Before PR/Release
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes (no type errors)
- [ ] Prisma schema matches TECHNICAL-SPECS.md
- [ ] All API keys encrypted (never plaintext)
- [ ] No Phase 2+ features implemented
- [ ] DEVELOPMENT_STATUS.md updated
- [ ] CHANGELOG.md updated

### Troubleshooting

#### Prisma Issues
```bash
rm -rf node_modules .next
npm install
npx prisma generate
npx prisma db push
```

#### Type Errors
- Check imports from `@/types`
- Run `npx tsc --noEmit` for detailed errors
- Ensure all Prisma types regenerated (`npx prisma generate`)

#### Provider Fails
- Check API key validity in Settings
- Test connection button in Settings UI
- Fallback: switch to different provider

### Code Style
- Components: `PascalCase.tsx`
- Libraries: `kebab-case.ts`
- API routes: `route.ts` in kebab-case folders
- TypeScript strict mode: no `any` types
- Error handling: all async operations need try/catch

### Security Checklist
- [ ] No hardcoded API keys
- [ ] All user input validated (Zod)
- [ ] File uploads limited (max 100MB)
- [ ] Audio files stored outside public/
- [ ] API keys encrypted in database

### Resources
- Next.js App Router: https://nextjs.org/docs/app
- Prisma Docs: https://www.prisma.io/docs
- shadcn/ui: https://ui.shadcn.com
- OpenAI Whisper API: https://platform.openai.com/docs/guides/speech-to-text
- Deepgram API: https://developers.deepgram.com/
- Vatis Tech: https://vatis.tech/documentation

---

## Quick Orientation for New Agents

1. **Read first**: `knowledge/TECHNICAL-SPECS.md` (complete architecture)
2. **Check current state**: `DEVELOPMENT_STATUS.md`
3. **Understand decisions**: `DECISIONS.md`
4. **Know constraints**: `GUARDRAILS.md` (security, scope)
5. **Check roadmap**: `STRATEGY.md` (Phase 1 MVP scope)
6. **Start coding**: Implement `STTProvider` abstraction first (most critical)

**Golden Rule**: All implementation decisions derive from `knowledge/` folder specs. Never assume.
