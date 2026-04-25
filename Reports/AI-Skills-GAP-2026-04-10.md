# AI Skills GAP Analysis — STT
**Data**: 2026-04-10
**Proiect**: STT (Medical Speech-to-Text for Romanian)
**Stack**: Next.js 14, React 18, TypeScript, Prisma, SQLite, shadcn/ui
**Deploy**: Local/on-premise (GDPR), Docker planned Phase 4
**Engines**: OpenAI Whisper, Deepgram, Vatis Tech, Whisper local

---

## 1. AI Skills Existente

| Skill | Status | Detalii |
|-------|--------|---------|
| OpenAI Whisper | DA — ACTIV | `src/lib/stt/providers/openai-whisper.ts` |
| Deepgram | DA — IMPLEMENTAT | Provider abstraction |
| Vatis Tech | DA — IMPLEMENTAT | Provider abstraction (RO specialized) |
| Whisper local | DA — IMPLEMENTAT | On-premise option |
| Provider abstraction layer | DA — ACTIV | `STTManager` singleton cu switch |
| AI Router | DA — MINIMAL | Passthrough wrapper |
| CLAUDE.md | DA | Comprehensiv (307 linii) |
| Credential encryption | DA | AES-256 pentru API keys |

**Total AI skills existente: 5/10**

---

## 2. AI Skills Necesare

| # | Skill AI | Prioritate | Complexitate | Impact |
|---|----------|-----------|--------------|--------|
| 1 | Medical terminology post-processing | **CRITICĂ** | Medie | Claude corectează termeni medicali |
| 2 | Speaker diarization | **ÎNALTĂ** | Mare | Doctor vs pacient |
| 3 | Template auto-fill | MEDIE | Medie | AI completează raport medical din transcriere |
| 4 | Real-time streaming | MEDIE | Mare | Transcriere live (Phase 3) |
| 5 | Custom vocabulary AI | OPȚIONAL | Medie | Vocabular medical personalizat |

---

## 3. Scor AI Readiness

| Criteriu | Scor | Max |
|----------|------|-----|
| CLAUDE.md | 2 | 2 |
| AI Router integrat | 1.5 | 2 |
| AI features implementate | 1.5 | 3 |
| Teste | 0 | 2 |
| Documentație | 1 | 1 |
| **TOTAL** | **6/10** | 10 |

**Verdict**: Provider abstraction matură (4 engines), CLAUDE.md comprehensiv, GDPR-compliant. Gap critic: medical terminology post-processing (ar diferenția produsul). Zero teste automate.
