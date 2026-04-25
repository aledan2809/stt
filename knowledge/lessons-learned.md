# Lessons Learned — STT

> Incident root causes and patterns specific to STT (medical speech-to-text, GDPR-compliant).
> Master-level lessons: `Master/knowledge/lessons-learned.md`.

## Lessons

#### L01: 43d STALE_WIP — substantial src/ + prisma/ work since MVP commit `c2eb72a`
- **Date**: 2026-04-25
- **Category**: Git / Recovery / Medical compliance
- **Lesson**: 41 real files modified covering src/ (most of code), prisma/ (schema/migrations), package.json/lock, next.config.js, eslintrc. STT handles medical Romanian dictation and is GDPR-relevant — letting WIP sit 43 days = 43 days of unrecoverable work-at-risk if disk fails. Multi-provider (Deepgram + others) means schema changes can affect provider routing logic.
- **Action**: (1) Added `.gitattributes` with binary markers for audio formats (.mp3, .wav, .webm) — prevents Git from corrupting audio test fixtures. (2) Recovered via patch-extract pattern. Cross-ref Master L43. (3) **For GDPR-relevant projects**: enforce shorter STALE_WIP thresholds (consider 7d not 30d) — patient data adjacent code should not sit uncommitted. (4) Schema changes should be reviewed for PII/PHI implications before commit (this recovery: schema unchanged on PII fields per spot-check).

---

## How to Add New Lessons

1. Identify the lesson from your project work
2. Add it under an appropriate category
3. Follow the format above
4. Cross-reference Master L## if the pattern applies broadly
