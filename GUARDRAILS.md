# GUARDRAILS.md - STT Module

## Critical Constraints (DO NOT VIOLATE)

### SECURITY
1. **NEVER store API keys in plaintext** - Always encrypt with AES-256
2. **NEVER commit .env files** - Add to .gitignore immediately
3. **NEVER log sensitive data** - Audio content, transcripts with PII, API keys
4. **NEVER expose audio files publicly** - Store outside public/ folder, serve via authenticated API only
5. **ALWAYS validate user input** - File uploads, form inputs (use Zod)
6. **ALWAYS use HTTPS in production** - Docker deployment must configure TLS

### GDPR COMPLIANCE
1. **Audio retention must be configurable** - User opts-in to keeping audio files
2. **Audit logs required** - Log WHO accessed WHAT WHEN (file: logs/audit.log)
3. **Right to erasure** - Delete transcript = delete audio + DB entry + any exports
4. **Data minimization** - Don't store patient PII in STT module (reference ID only)
5. **Encryption at rest** - SQLite file should be encrypted (OS-level or app-level)
6. **No third-party analytics** - No Google Analytics, Sentry, etc. without explicit consent

### MEDICAL CONTEXT
1. **Doctor is in control** - AI is assistant, not decision-maker (UI must make this clear)
2. **Disclaimers required** - "Review all AI-generated text before use"
3. **No diagnostic suggestions** - STT module does transcription only, not medical advice
4. **Accuracy transparency** - Display confidence scores where available

### CODE QUALITY
1. **TypeScript strict mode** - No `any` types unless absolutely necessary
2. **Error handling required** - All async operations must have try/catch
3. **No hardcoded secrets** - Use environment variables
4. **Provider abstraction must be maintained** - New providers MUST implement STTProvider interface
5. **Database migrations only** - Never manually edit SQLite, always use Prisma migrations

### SCOPE CONTROL (MVP)
1. **Phase 1 ONLY**: Batch transcription, provider selection, basic UI
2. **NO real-time streaming** - Phase 3 feature, do not implement yet
3. **NO post-processing pipeline** - Phase 2 feature, raw STT output only for now
4. **NO multi-user/auth** - Single-user MVP, defer to Phase 4
5. **NO mobile app** - Web only for MVP
6. **NO Docker deployment** - Manual npm install for MVP, Docker in Phase 4

## Coding Standards

### File Naming
- Components: `PascalCase.tsx` (RecordButton.tsx)
- Libraries: `kebab-case.ts` (whisper-local.ts)
- API routes: `route.ts` in kebab-case folders (/api/transcribe/route.ts)

### TypeScript
```typescript
// GOOD
interface TranscriptResult {
  text: string;
  confidence: number;
}

// BAD
const result: any = await transcribe() // No 'any'
```

### Error Handling
```typescript
// GOOD
try {
  const result = await provider.transcribe(audio)
  return result
} catch (error) {
  console.error('Transcription failed:', error)
  throw new Error('Transcription service unavailable')
}

// BAD
const result = await provider.transcribe(audio) // No error handling
```

### Environment Variables
```typescript
// GOOD
const apiKey = process.env.OPENAI_API_KEY
if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

// BAD
const apiKey = 'sk-...' // Hardcoded secret
```

## Testing Requirements

### MVP Testing (Manual)
- [ ] Upload 1-minute Romanian audio -> receives accurate transcript
- [ ] Switch provider in Settings -> next transcription uses new provider
- [ ] Test connection button -> validates API key correctly
- [ ] Save transcript -> appears in dashboard history
- [ ] Delete transcript -> removes from DB and deletes audio file
- [ ] Invalid API key -> displays error message (doesn't crash)

### Future Testing (Phase 4)
- Unit tests for provider implementations
- Integration tests for API routes
- E2E tests for full transcription flow

## Performance Guardrails

### File Size Limits
- **Audio uploads**: Max 100MB (configurable via env var)
- **Transcription length**: Warn if >30 minutes (may timeout)

### Response Times (Target)
- **API key validation**: <3 seconds
- **1-minute audio transcription**: <30 seconds (provider-dependent)
- **Dashboard load**: <1 second

### Database
- **Auto-vacuum SQLite**: Enable to prevent file bloat
- **Connection pooling**: Not needed for SQLite single-user

## Deployment Guardrails

### Environment Variables Required
```env
DATABASE_URL=file:./data/stt.db
ENCRYPTION_KEY=<32-byte hex string>
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (provider API keys)
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=...
VATIS_TECH_API_KEY=...
```

### Pre-Deployment Checklist
- [ ] All API keys removed from code (env vars only)
- [ ] .env file NOT committed
- [ ] Prisma migrations applied (npx prisma db push)
- [ ] ffmpeg installed on target system
- [ ] Node.js 18+ confirmed
- [ ] Build succeeds (npm run build)
- [ ] Production env vars configured

## Monitoring & Alerts (Phase 4)

### Log What Matters
- Transcription start/complete (with duration, provider, file size)
- Transcription failures (provider, error message)
- Provider API errors (rate limits, auth failures)
- Audio file deletion (audit trail)

### Don't Log
- Full transcription text (may contain PII)
- API keys (even encrypted)
- Audio file contents

### Alerts (Future)
- Disk space <10% (audio files filling disk)
- Transcription failure rate >10%
- Provider API response time >60 seconds

## Rollback Plan

### If Deployment Fails
1. Revert to previous git commit
2. Re-run `npm install` (lockfile may have changed)
3. Re-run `npx prisma generate` (if schema changed)
4. Restart app

### If Provider Breaks
1. User switches provider in Settings UI (immediate workaround)
2. Dev investigates API changes
3. Update provider implementation
4. Redeploy

### If Data Corruption
1. SQLite backup (user must have backup strategy)
2. Restore from backup
3. Prisma migrations re-apply if needed

## Emergency Contacts (Phase 4)
- **Provider Support**:
  - OpenAI: https://help.openai.com/
  - Deepgram: support@deepgram.com
  - Vatis Tech: contact@vatis.tech
- **Critical Bug**: [Define escalation path]

## Do NOT Implement Without Approval
- Changes to provider abstraction interface (breaks all providers)
- Database schema changes (requires migration)
- New external API dependencies (security review needed)
- Multi-user features (auth required first)
- Cloud deployment (scope is on-premise only)
