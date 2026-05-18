# AUDIT_GAPS — STT
Last Updated: 2026-05-18

## Eliminated Gaps

| ID | Severitate | Descriere | Status | Commit | Data |
|----|-----------|-----------|--------|--------|------|
| G-STT-001 | P2 | Lipsă viewport export Next.js 16 (layout.tsx) | Eliminated | 93d138d | 2026-05-18 |
| G-STT-002 | P1 | Lipsă rate limiting pe /api/settings (GET+PUT) | Eliminated | 93d138d | 2026-05-18 |
| G-STT-003 | P1 | Lipsă rate limiting pe /api/settings/test-provider (POST) — enumeration API keys | Eliminated | 93d138d | 2026-05-18 |
| G-STT-004 | P2 | Whitespace-only password accepted (auth.ts setPassword) | Eliminated | 93d138d | 2026-05-18 |

## Open Gaps

| ID | Severitate | Descriere | Status | Note |
|----|-----------|-----------|--------|------|
| G-STT-005 | P1 | SHA-256 password hashing fără salt (auth.ts) — ar trebui bcrypt/argon2 | OPEN | Fix necesită migrare parole existente; acceptat pentru MVP single-user |
| G-STT-006 | P3 | console.error() expus în producție (mai multe fișiere) | OPEN | Low risk pentru tool local |

Journey audit: 5/5 OK (/, /record, /reports, /history, /settings)
ML2 Wave 5 Verdict: PASS
