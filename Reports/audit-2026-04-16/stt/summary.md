# STT Module Audit Report

**Date**: 2026-04-20
**Scope**: Full codebase audit + validation passes — build, lint, TypeScript, security, architecture, robustness
**Project**: STT Module v0.1.0 (Next.js 14, TypeScript, Prisma/SQLite)

---

## Results Summary

| Metric | Value |
|--------|-------|
| Issues found | 21 |
| Issues fixed | 20 |
| Issues acknowledged | 1 |
| Build | PASS |
| TypeScript | PASS (0 errors) |
| Lint | PASS (0 errors, 0 warnings) |

---

## Wave 5 — Initial Audit Fixes (8)

1. **STT-001** (critical) — `TURBOPACK=1` env var breaks `npm run build`
2. **STT-002** (critical) — `NODE_ENV=development` during build causes prerender failures
3. **STT-003** (critical) — TooltipProvider in Server Component layout
4. **STT-005** (high) — ESLint config broken (.eslintrc.json deleted)
5. **STT-006** (high) — `error: any` in 12 catch blocks
6. **STT-010** (medium) — Empty interface lint errors block build
7. **STT-011** (medium) — Unused import in deepgram.ts
8. **STT-012** (medium) — Auth password hash stored without `encrypted: true`

## Wave 5 — Validate Fixes (5)

9. **STT-004** (critical/security) — Path traversal vulnerability in DELETE endpoint
   - `audioPath` used directly in `fs.unlink()` without validation
   - Fix: Added guard ensuring resolved path stays within project directory

10. **STT-007** (high/robustness) — Unguarded `JSON.parse` in 5 locations
    - `transcribe/route.ts`, `settings/route.ts`, `manager.ts`, `transcribe/[id]/route.ts`
    - Fix: Wrapped all in try-catch with proper error responses or fallbacks

11. **STT-008** (high/data-integrity) — Vocabulary import upsert uses invalid id pattern
    - `where: { id: '${domain}-${term}' }` always fails (ids are CUIDs)
    - Fix: Replaced with `findFirst` by term+domain, then update or create

12. **STT-009** (high/functionality) — Test-provider endpoint excludes whisper-local
    - Users cannot test local whisper provider connection
    - Fix: Added `whisper-local` to Zod enum

13. **STT-013** (medium) — 32 of 35 lint warnings cleaned up

## Wave 5 — Validate Pass 2 Fixes (6)

14. **STT-016** (high/runtime) — `/api/auth/status` rendered as static page
    - Fix: Added `export const dynamic = 'force-dynamic'`

15. **STT-017** (medium/lint) — ESLint `no-unused-vars` not ignoring underscore-prefixed args
    - Fix: Added `argsIgnorePattern: "^_"` to ESLint config

16. **STT-018** (high/robustness) — Unguarded `JSON.parse` in templates routes (4 locations)
    - `templates/route.ts` GET + POST, `templates/[id]/route.ts` GET + PUT
    - Fix: Wrapped all in try-catch with `{ sections: [] }` fallback

17. **STT-019** (medium/robustness) — Unguarded `JSON.parse` in whisper-server `getSavedModel()`
    - Fix: Wrapped in try-catch with `'small'` fallback default

18. **STT-020** (high/data-integrity) — Report DELETE leaves orphan transcription.reportId
    - Deleting report doesn't null out reportId on linked transcriptions
    - Fix: Added `transcription.updateMany` to set `reportId=null` before deletion

19. **STT-021** (low/security) — Whisper-server start accepts unvalidated model name for `spawn`
    - Fix: Added validation against MODELS list before `spawn`

20. **STT-021b** (medium/data-integrity) — Vocabulary bulk POST allows duplicate entries
    - Fix: Added `findFirst` duplicate check before creating each term

## Acknowledged Issues (1)

21. **STT-014** (low) — `ai-router: file:../AIRouter` local dependency

---

## Files Modified (All Waves)

| File | Changes |
|------|---------|
| `package.json` | Build script (unset TURBOPACK, NODE_ENV=production) |
| `src/app/layout.tsx` | Moved TooltipProvider to client component |
| `src/components/layout/Providers.tsx` | New client component wrapper |
| `.eslintrc.json` | Restored + argsIgnorePattern |
| `src/components/ui/input.tsx` | Interface -> type alias |
| `src/components/ui/textarea.tsx` | Interface -> type alias |
| `src/lib/stt/providers/*.ts` | Removed `error: any`, proper error guards |
| `src/lib/stt/manager.ts` | Safe JSON.parse, error guards |
| `src/lib/auth.ts` | `encrypted: true` flag |
| `src/app/api/transcribe/route.ts` | Safe JSON.parse for options + metadata |
| `src/app/api/transcribe/[id]/route.ts` | Path traversal guard + safe JSON.parse |
| `src/app/api/settings/route.ts` | Safe JSON.parse for setting values |
| `src/app/api/settings/test-provider/route.ts` | Added whisper-local to enum |
| `src/app/api/vocabulary/import/route.ts` | Fixed upsert logic |
| `src/app/api/vocabulary/route.ts` | Added duplicate check for bulk POST |
| `src/app/api/templates/route.ts` | Safe JSON.parse (2 locations) |
| `src/app/api/templates/[id]/route.ts` | Safe JSON.parse (2 locations) |
| `src/app/api/whisper-server/route.ts` | Safe JSON.parse + model validation |
| `src/app/api/reports/[id]/route.ts` | Orphan cleanup on DELETE |

---

## Retest Results

```
npm run build        -> PASS (19 static pages, all API routes compiled, 0 errors)
npx tsc --noEmit     -> PASS (0 errors)
npm run lint         -> PASS (0 errors, 0 warnings)
```

---

## Recommendations

1. Add `@@unique([term, domain])` constraint to CustomVocabulary in Prisma schema
2. Publish `ai-router` as npm package or monorepo workspace
3. Add automated tests (currently 0 test files)
4. Consider Next.js 15 upgrade for native turbopack build support
