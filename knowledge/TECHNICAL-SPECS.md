# STT Module - Specificatii Tehnice & Roadmap

## Changelog
- [2026-03-12] v1.0: Specificatii initiale complete, roadmap 4 faze

---

## Viziune produs

**STT Module** este un modul generic, refolosibil de Speech-to-Text cu suport nativ pentru limba romana, orientat initial pe domeniul medical/dentar. Permite dictare vocala si transcriptie automata cu selectie de provider STT din UI.

### Target users (MVP)
- Medici (dictare rapoarte medicale)
- Dentisti (documentatie hands-free in timpul procedurilor)

### Deployment model
- **On-premise la client** (clinica/cabinet)
- Zero date parasesc infrastructura clientului (GDPR compliant by design)
- Docker-based deployment

---

## Stack tehnic recomandat

### Frontend
- **Next.js 14+** (App Router)
- **React 18+**
- **Tailwind CSS** + **shadcn/ui** (componente)
- **WebSocket client** pentru streaming real-time

### Backend
- **Next.js API Routes** (pentru MVP)
- **Node.js** runtime
- **WebSocket server** (ws sau Socket.io) pentru audio streaming

### STT Engine (configurabil din UI)
- **Primary**: faster-whisper (self-hosted, open-source)
- **Fallback API providers**: Vatis Tech, Deepgram, OpenAI Whisper API, Azure Speech
- Provider selectabil din Settings UI

### Database
- **SQLite** (pentru on-premise simplicity) via **Prisma ORM**
- Alternativa: PostgreSQL daca clientul are deja infra

### Audio Processing
- **ffmpeg** pentru conversie audio (WebM/Opus -> WAV 16kHz mono PCM)
- **VAD (Voice Activity Detection)** pentru segmentare
- Client-side noise reduction optional

### AI Post-Processing
- **Claude API** sau **OpenAI API** pentru:
  - Corectie termeni medicali
  - Restaurare diacritice
  - Structurare output (SOAP notes, rapoarte)
  - NER (Named Entity Recognition)

---

## Arhitectura aplicatiei

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js)                                             │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  Dashboard    │  │  Recorder    │  │  Settings          │    │
│  │  - Rapoarte  │  │  - Microfon  │  │  - Provider STT    │    │
│  │  - Istoric    │  │  - Waveform  │  │  - Model select    │    │
│  │  - Search     │  │  - Controls  │  │  - API keys        │    │
│  │  - Export     │  │  - Status    │  │  - Language         │    │
│  └──────────────┘  └──────┬───────┘  │  - Post-processing │    │
│                           │          │  - Audio settings   │    │
│                           │          └────────────────────┘    │
│                           │ WebSocket / REST                    │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Next.js API Routes + WebSocket Server)                │
│                                                                 │
│  ┌────────────────┐  ┌─────────────────┐  ┌────────────────┐  │
│  │ /api/transcribe│  │ /api/settings   │  │ /api/reports   │  │
│  │ - upload file  │  │ - GET/PUT config│  │ - CRUD rapoarte│  │
│  │ - stream audio │  │ - provider swap │  │ - export PDF   │  │
│  │ - status poll  │  │ - model select  │  │ - search       │  │
│  └───────┬────────┘  └─────────────────┘  └────────────────┘  │
│          │                                                      │
│  ┌───────▼──────────────────────────────────────────────────┐  │
│  │  STT ENGINE MANAGER (Provider Abstraction Layer)          │  │
│  │                                                           │  │
│  │  ┌───────────┐ ┌──────────┐ ┌────────┐ ┌─────────────┐  │  │
│  │  │ Whisper   │ │ Vatis    │ │Deepgram│ │ Azure/Google│  │  │
│  │  │ (local)   │ │ Tech API │ │ API    │ │ API         │  │  │
│  │  └───────────┘ └──────────┘ └────────┘ └─────────────┘  │  │
│  │                                                           │  │
│  │  Interface comuna:                                        │  │
│  │  - transcribe(audioBuffer, options) -> TranscriptResult   │  │
│  │  - streamStart(ws, options) -> StreamSession              │  │
│  │  - streamChunk(session, chunk) -> PartialResult           │  │
│  │  - streamEnd(session) -> FinalResult                      │  │
│  │  - getCapabilities() -> ProviderCapabilities              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  POST-PROCESSING PIPELINE                                 │  │
│  │                                                           │  │
│  │  Raw Text                                                 │  │
│  │    -> [1] Restaurare diacritice (NLP model)               │  │
│  │    -> [2] Punctuatie & capitalizare                        │  │
│  │    -> [3] Corectie termeni medicali (LLM)                 │  │
│  │    -> [4] NER: medicamente, diagnostice, proceduri        │  │
│  │    -> [5] Structurare template (SOAP, raport)             │  │
│  │    -> [6] Output formatat                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  DATA LAYER (Prisma + SQLite)                             │  │
│  │                                                           │  │
│  │  - Transcriptions (id, audio_path, text, provider, etc.) │  │
│  │  - Reports (id, title, content, template, patient_ref)   │  │
│  │  - Settings (key, value, encrypted)                       │  │
│  │  - Templates (id, name, structure, domain)                │  │
│  │  - CustomVocabulary (id, term, domain, phonetic_hint)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Prisma)

```prisma
model Setting {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // JSON string, encrypted for sensitive data
  encrypted Boolean  @default(false)
  updatedAt DateTime @updatedAt
}

model Transcription {
  id           String   @id @default(cuid())
  audioPath    String?  // path to original audio file (on-premise)
  text         String   // raw transcription
  processedText String? // after post-processing pipeline
  provider     String   // whisper-local, vatis, deepgram, azure, etc.
  model        String?  // whisper-large-v3, nova-2, etc.
  language     String   @default("ro")
  duration     Float?   // audio duration in seconds
  confidence   Float?   // average confidence score
  wordCount    Int?
  status       String   @default("completed") // processing, completed, failed
  metadata     String?  // JSON: speaker labels, timestamps, etc.
  reportId     String?
  report       Report?  @relation(fields: [reportId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Report {
  id             String          @id @default(cuid())
  title          String
  content        String          // formatted report content (markdown/HTML)
  templateId     String?
  template       Template?       @relation(fields: [templateId], references: [id])
  patientRef     String?         // reference ID (no PII stored directly)
  domain         String          @default("general") // medical, dental, general
  status         String          @default("draft") // draft, final, exported
  exportedPath   String?         // path to exported PDF
  transcriptions Transcription[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model Template {
  id        String   @id @default(cuid())
  name      String
  structure String   // JSON: sections, fields, prompts
  domain    String   // medical, dental, general
  isDefault Boolean  @default(false)
  reports   Report[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CustomVocabulary {
  id           String  @id @default(cuid())
  term         String
  domain       String  // medical, dental, general
  phoneticHint String? // pronunciation hint for STT
  replacement  String? // auto-correct target
  isActive     Boolean @default(true)
}
```

---

## Provider Abstraction Layer - Detalii

### Interface `STTProvider`

```typescript
interface STTProviderConfig {
  apiKey?: string;
  apiUrl?: string;
  model?: string;
  language?: string;        // default: "ro"
  sampleRate?: number;       // default: 16000
  enableDiarization?: boolean;
  enablePunctuation?: boolean;
  customVocabulary?: string[];
}

interface TranscriptResult {
  text: string;
  confidence: number;
  duration: number;
  words?: WordTimestamp[];
  speakers?: SpeakerSegment[];
  language: string;
  provider: string;
  model: string;
}

interface WordTimestamp {
  word: string;
  start: number;  // seconds
  end: number;
  confidence: number;
  speaker?: string;
}

interface SpeakerSegment {
  speaker: string;  // "Speaker 1", "Doctor", "Pacient"
  start: number;
  end: number;
  text: string;
}

interface PartialResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

interface ProviderCapabilities {
  name: string;
  supportsStreaming: boolean;
  supportsBatch: boolean;
  supportsDiarization: boolean;
  supportsCustomVocabulary: boolean;
  maxAudioDuration: number;   // seconds
  maxFileSize: number;        // bytes
  supportedFormats: string[]; // ['wav', 'mp3', 'webm', 'ogg']
  pricePerMinute: number;     // USD
  isLocal: boolean;           // true for self-hosted
}

// Abstract class - fiecare provider implementeaza
abstract class STTProvider {
  abstract name: string;
  abstract transcribe(audio: Buffer, options: STTProviderConfig): Promise<TranscriptResult>;
  abstract streamStart(ws: WebSocket, options: STTProviderConfig): Promise<StreamSession>;
  abstract streamChunk(session: StreamSession, chunk: Buffer): Promise<PartialResult>;
  abstract streamEnd(session: StreamSession): Promise<TranscriptResult>;
  abstract getCapabilities(): ProviderCapabilities;
  abstract validateConfig(): Promise<{ valid: boolean; error?: string }>;
}
```

### Provideri de implementat

#### 1. WhisperLocalProvider
- Ruleaza faster-whisper local via Python subprocess
- Model: whisper-large-v3 sau fine-tuned Romanian
- Zero cost per minut (doar hardware)
- Batch only in MVP, streaming in Faza 3
- Necesita: Python 3.10+, CUDA toolkit (optional, merge si pe CPU)

#### 2. VatisTechProvider
- API REST + WebSocket
- Endpoint: api.vatis.tech/v1/transcribe
- Auth: API key in header
- Real-time streaming suportat nativ
- Best accuracy pe romana

#### 3. DeepgramProvider
- WebSocket streaming nativ
- SDK: @deepgram/sdk (npm)
- Custom vocabulary via API
- Speaker diarization inclus

#### 4. OpenAIWhisperProvider
- REST API only (nu streaming)
- Endpoint: api.openai.com/v1/audio/transcriptions
- Max 25MB per file
- Model: whisper-1

#### 5. AzureSpeechProvider
- SDK: microsoft-cognitiveservices-speech-sdk (npm)
- WebSocket streaming
- Custom model training disponibil
- Region-based endpoint

#### 6. GoogleCloudProvider
- SDK: @google-cloud/speech (npm)
- Streaming recognition via gRPC
- Dynamic batching disponibil

---

## Pagini & Componente UI

### 1. Dashboard (`/`)
- **Lista rapoarte** recente cu search & filter
- Status transcrieri in progress
- Statistici: total ore transcrise, rapoarte create, provider usage
- Quick action: "Dictare noua"

### 2. Recorder Page (`/record`)
- **Buton mare Record** (start/stop/pause)
- **Waveform vizualizare** audio in real-time (wavesurfer.js sau custom canvas)
- **Live transcription panel** - text apare pe masura ce se vorbeste
- **Timer** durata inregistrare
- **Selector template** (SOAP, Raport General, Consultatie Dentara, etc.)
- **Upload file** alternativ (drag & drop audio file)
- Post-dictare:
  - Edit text manual
  - Re-process cu alt provider
  - Aplica template
  - Salveaza ca raport

### 3. Report View/Edit (`/reports/[id]`)
- **Rich text editor** cu continutul transcris si structurat
- **Sidebar**: metadata (provider, durata, confidence, data)
- **Template overlay**: structura SOAP sau template custom
- **Export**: PDF, DOCX, clipboard
- **Audio playback** sincronizat cu text (click pe text -> sari la momentul audio)
- **Speaker labels** vizualizate color-coded

### 4. Settings (`/settings`)

#### Tab: Provider STT
- **Lista provideri** cu toggle activ/inactiv
- **Provider activ** (radio select) - care se foloseste by default
- **Per provider**:
  - API Key input (masked, encrypted in DB)
  - Model select (dropdown cu modele disponibile per provider)
  - Test connection button (transcrie 5 secunde de test)
  - Status indicator (verde/rosu)
  - Capabilities display (streaming, diarization, etc.)
  - Cost estimat per minut

#### Tab: Language & Processing
- **Limba** dropdown (Romana default, + alte limbi)
- **Post-processing** toggles:
  - Restaurare diacritice: on/off
  - Punctuatie automata: on/off
  - Corectie termeni medicali: on/off
  - Structurare automata (template): on/off
- **LLM pentru post-processing**: selectie provider (Claude/OpenAI) + API key

#### Tab: Audio
- **Input device** selection (microfon)
- **Sample rate**: 16kHz (recomandat) / 44.1kHz / 48kHz
- **Noise reduction**: on/off
- **Format stocare**: WAV / WebM / MP3
- **Auto-delete audio** dupa transcriptie: on/off (GDPR)

#### Tab: Templates
- **Lista template-uri** cu CRUD
- **Template editor**: sectiuni, campuri, prompts pentru LLM
- **Template-uri default** pre-built:
  - SOAP Note (medical general)
  - Consultatie Dentara
  - Raport Radiologic
  - Fisa Observatie
  - Custom

#### Tab: Vocabulary
- **Custom vocabulary** management
- Adauga/sterge termeni per domeniu (medical, dentar)
- Import/export lista (CSV)
- Phonetic hints optional

### 5. History (`/history`)
- **Lista completa** transcrieri cu filtre:
  - Data range
  - Provider folosit
  - Domeniu (medical/dentar/general)
  - Status (draft/final/exported)
- **Bulk export**
- **Bulk delete** cu confirmare

---

## API Routes

### Transcription
```
POST   /api/transcribe          - Upload file + transcribe (batch)
POST   /api/transcribe/stream   - WebSocket upgrade for real-time
GET    /api/transcribe/[id]     - Get transcription by ID
DELETE /api/transcribe/[id]     - Delete transcription + audio
GET    /api/transcribe/status/[id] - Poll transcription status
```

### Reports
```
GET    /api/reports             - List reports (paginated, filterable)
POST   /api/reports             - Create report from transcription(s)
GET    /api/reports/[id]        - Get report
PUT    /api/reports/[id]        - Update report
DELETE /api/reports/[id]        - Delete report
POST   /api/reports/[id]/export - Export report (PDF/DOCX)
```

### Settings
```
GET    /api/settings            - Get all settings
PUT    /api/settings            - Update settings
POST   /api/settings/test-provider - Test STT provider connection
GET    /api/settings/providers  - List available providers + capabilities
```

### Templates
```
GET    /api/templates           - List templates
POST   /api/templates           - Create template
PUT    /api/templates/[id]      - Update template
DELETE /api/templates/[id]      - Delete template
```

### Vocabulary
```
GET    /api/vocabulary          - List custom vocabulary
POST   /api/vocabulary          - Add term(s)
PUT    /api/vocabulary/[id]     - Update term
DELETE /api/vocabulary/[id]     - Delete term
POST   /api/vocabulary/import   - Import CSV
GET    /api/vocabulary/export   - Export CSV
```

---

## Audio Pipeline - Detalii tehnice

### Client-side (browser)
```
1. navigator.mediaDevices.getUserMedia({ audio: true })
2. MediaRecorder API -> WebM/Opus chunks (250ms interval)
3. Optional: Web Audio API noise gate / RNNoise WASM
4. Send chunks via WebSocket to server
```

### Server-side processing
```
1. Receive audio chunks via WebSocket
2. Buffer in memory (session-specific)
3. On speech pause (VAD detection) or manual stop:
   a. Concatenate chunks
   b. ffmpeg convert: WebM -> WAV 16kHz mono PCM
   c. Send to active STT provider
   d. Receive transcript
   e. Run post-processing pipeline
   f. Send result back to client via WebSocket
   g. Store in DB
4. Store audio file on disk (configurable retention)
```

### ffmpeg conversion command
```bash
ffmpeg -i input.webm -ar 16000 -ac 1 -f wav output.wav
```

### VAD (Voice Activity Detection)
- **@ricky0123/vad-web** - WebVAD pentru browser
- **silero-vad** - model PyTorch pentru server
- Detecteaza pauze naturale in vorbire pentru segmentare

---

## Post-Processing Pipeline - Detalii

### Step 1: Restaurare diacritice
- Input: "Pacientul prezinta durere in zona molara"
- Output: "Pacientul prezinta durere in zona molara"
- Approach: model NLP specializat (RNN sau transformer mic)
- Alternativ: inclus in Step 3 (LLM corectie)

### Step 2: Punctuatie & Capitalizare
- Multe provideri includ deja punctuatie (Deepgram, Vatis)
- Pentru Whisper local: model de punctuatie separat sau LLM

### Step 3: Corectie termeni medicali (LLM)
- Prompt template:
```
Esti un asistent medical specializat in transcriptii.
Corecteaza urmatorul text transcris din dictare medicala in limba romana.
- Corecteaza termenii medicali gresiti
- Adauga diacritice corecte
- Pastreaza sensul original
- Nu adauga informatii noi

Text original: {raw_text}
Text corectat:
```

### Step 4: NER (Named Entity Recognition)
- Extrage: medicamente, diagnostice, proceduri, valori laborator
- Foloseste LLM sau model NER dedicat (spaCy cu model RO)

### Step 5: Structurare template
- SOAP Note template:
```
S (Subiectiv): [simptome raportate de pacient]
O (Obiectiv): [constatari clinice]
A (Assessment): [diagnostic/evaluare]
P (Plan): [plan de tratament]
```
- LLM mapeaza textul liber pe sectiunile template-ului

### Step 6: Output formatat
- Markdown pentru stocare
- HTML/PDF pentru export
- JSON structurat pentru integrari viitoare

---

## Docker Deployment (On-Premise)

### docker-compose.yml structure
```yaml
services:
  stt-app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data          # SQLite DB
      - ./audio:/app/audio        # Audio files
      - ./models:/app/models      # Whisper models
    environment:
      - DATABASE_URL=file:./data/stt.db
      - WHISPER_MODEL_PATH=/app/models/whisper-large-v3

  whisper-server:
    build: ./whisper
    runtime: nvidia              # GPU support
    volumes:
      - ./models:/models
    ports:
      - "8080:8080"              # Internal API
    environment:
      - MODEL=large-v3
      - DEVICE=cuda              # or cpu
      - LANGUAGE=ro
```

### Whisper server (faster-whisper)
- Python FastAPI wrapper around faster-whisper
- Endpoint: POST /transcribe (multipart audio)
- Endpoint: WS /stream (WebSocket streaming)
- Auto-download model la prima rulare
- GPU: ~2GB VRAM pentru large-v3
- CPU: functional dar 10-20x mai lent

---

## Roadmap

### Faza 1 - MVP Core (2-3 saptamani)
**Obiectiv**: Dictare + transcriptie functionala cu un provider

- [ ] Setup Next.js project + Prisma + SQLite
- [ ] Provider abstraction layer (interface + WhisperLocalProvider)
- [ ] POST /api/transcribe - upload audio file, transcribe, return text
- [ ] Recorder page cu buton record + MediaRecorder API
- [ ] Afisare rezultat transcriptie (textarea editabila)
- [ ] Settings page: provider select + API key management
- [ ] Implementare 2-3 provideri API (OpenAI Whisper, Deepgram, Vatis Tech)
- [ ] Test connection din Settings
- [ ] Salvare transcrieri in DB
- [ ] Dashboard cu lista transcrieri

**Deliverable**: Aplicatie functionala unde medicul poate dicta, transcrie, si edita textul

### Faza 2 - Templates & Rapoarte (2-3 saptamani)
**Obiectiv**: Structurare output medical + export

- [ ] Template system (CRUD + pre-built templates)
- [ ] Post-processing pipeline: diacritice + punctuatie + LLM corectie
- [ ] Structurare automata pe template (SOAP notes)
- [ ] Report CRUD cu rich text editor
- [ ] Export PDF/DOCX
- [ ] Custom vocabulary management
- [ ] History page cu search & filters
- [ ] Audio playback sincronizat cu text

**Deliverable**: Medic dicteaza -> raport medical structurat generat automat

### Faza 3 - Real-time Streaming (2-3 saptamani)
**Obiectiv**: Transcriptie live in timp real

- [ ] WebSocket server pentru audio streaming
- [ ] Client-side audio chunking (250ms)
- [ ] Live transcription display (text apare pe masura ce se vorbeste)
- [ ] VAD integration (detectie pauze)
- [ ] Noise reduction client-side
- [ ] Speaker diarization (doctor vs pacient)
- [ ] Waveform visualization

**Deliverable**: Text apare live pe ecran in timp ce medicul vorbeste

### Faza 4 - Production & Optimizare (2-3 saptamani)
**Obiectiv**: Production-ready, Docker deployment

- [ ] Docker compose setup (app + whisper-server)
- [ ] GPU support pentru Whisper local
- [ ] Auto-download modele la prima rulare
- [ ] GDPR compliance: auto-delete audio, audit logs, encryption
- [ ] Bulk operations (export, delete)
- [ ] Performance optimization (caching, queue processing)
- [ ] Error handling & retry logic
- [ ] Documentatie utilizator (in-app help)
- [ ] Testing suite (unit + integration)

**Deliverable**: Aplicatie deployable on-premise la client

### TODO viitor (post-MVP)
- [ ] Integrari externe (EHR, CRM) - de definit cand se stie cu ce sisteme
- [ ] Fine-tune Whisper pe date proprii (necesita corpus audio medical RO)
- [ ] Mobile app (React Native) pentru dictare on-the-go
- [ ] Multi-user support cu roles (medic, asistent, admin)
- [ ] Ambient listening mode (conversatie continua doctor-pacient)
- [ ] Analytics dashboard (volume, costuri per provider, accuracy trends)
- [ ] Whisper model auto-update

---

## Estimari resurse

### Hardware minim (on-premise)
- **CPU only**: orice PC modern (i5+, 16GB RAM) - Whisper merge dar lent (~10x real-time)
- **Cu GPU**: NVIDIA RTX 3060+ (6GB+ VRAM) - Whisper large-v3 in near real-time
- **Stocare**: 10GB pentru aplicatie + modele, + spatiu pentru audio files

### Dependente externe
- Node.js 18+
- Python 3.10+ (pentru faster-whisper)
- ffmpeg (audio conversion)
- Docker & Docker Compose (deployment)
- CUDA toolkit (optional, pentru GPU acceleration)

---

## Conventii de cod

### Structura fisiere
```
D:\Projects\STT\
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Dashboard
│   │   ├── record/page.tsx     # Recorder
│   │   ├── reports/
│   │   │   ├── page.tsx        # Reports list
│   │   │   └── [id]/page.tsx   # Report view/edit
│   │   ├── history/page.tsx    # History
│   │   ├── settings/page.tsx   # Settings
│   │   └── api/
│   │       ├── transcribe/
│   │       │   ├── route.ts        # POST upload + transcribe
│   │       │   ├── stream/route.ts # WebSocket streaming
│   │       │   └── [id]/route.ts   # GET/DELETE specific
│   │       ├── reports/
│   │       │   ├── route.ts        # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET/PUT/DELETE
│   │       │       └── export/route.ts
│   │       ├── settings/
│   │       │   ├── route.ts
│   │       │   ├── test-provider/route.ts
│   │       │   └── providers/route.ts
│   │       ├── templates/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── vocabulary/
│   │           ├── route.ts
│   │           ├── [id]/route.ts
│   │           ├── import/route.ts
│   │           └── export/route.ts
│   ├── lib/
│   │   ├── stt/
│   │   │   ├── provider.ts         # Abstract STTProvider class
│   │   │   ├── manager.ts          # Provider manager (select, switch)
│   │   │   ├── providers/
│   │   │   │   ├── whisper-local.ts
│   │   │   │   ├── vatis-tech.ts
│   │   │   │   ├── deepgram.ts
│   │   │   │   ├── openai-whisper.ts
│   │   │   │   ├── azure-speech.ts
│   │   │   │   └── google-cloud.ts
│   │   │   └── index.ts
│   │   ├── pipeline/
│   │   │   ├── post-processor.ts   # Post-processing orchestrator
│   │   │   ├── diacritics.ts       # Diacritics restoration
│   │   │   ├── medical-correction.ts
│   │   │   ├── template-mapper.ts
│   │   │   └── ner.ts
│   │   ├── audio/
│   │   │   ├── converter.ts        # ffmpeg wrapper
│   │   │   ├── vad.ts              # Voice activity detection
│   │   │   └── recorder.ts         # Client-side recorder utils
│   │   ├── db.ts                   # Prisma client
│   │   └── crypto.ts               # Encryption for API keys
│   ├── components/
│   │   ├── recorder/
│   │   │   ├── RecordButton.tsx
│   │   │   ├── Waveform.tsx
│   │   │   ├── LiveTranscript.tsx
│   │   │   └── AudioUpload.tsx
│   │   ├── reports/
│   │   │   ├── ReportEditor.tsx
│   │   │   ├── ReportCard.tsx
│   │   │   └── TemplateSelector.tsx
│   │   ├── settings/
│   │   │   ├── ProviderCard.tsx
│   │   │   ├── ProviderSettings.tsx
│   │   │   └── AudioSettings.tsx
│   │   └── ui/                     # shadcn/ui components
│   └── types/
│       ├── stt.ts                  # STT-related types
│       └── reports.ts
├── prisma/
│   └── schema.prisma
├── whisper/                        # Whisper server (Python)
│   ├── Dockerfile
│   ├── server.py                   # FastAPI wrapper
│   └── requirements.txt
├── docker-compose.yml
├── knowledge/
│   ├── STT-RESEARCH-REPORT.md
│   └── TECHNICAL-SPECS.md
├── CLAUDE.md
├── DEVELOPMENT_STATUS.md
└── package.json
```

### Naming conventions
- Fisiere componente: PascalCase (RecordButton.tsx)
- Fisiere lib/utils: kebab-case (whisper-local.ts)
- API routes: kebab-case folders
- DB models: PascalCase (Prisma convention)
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase

---

## Note pentru Website Guru

### Cum sa incepi
1. Citeste acest fisier complet + STT-RESEARCH-REPORT.md
2. Incepe cu Faza 1 - MVP Core
3. Setup Next.js, Prisma, SQLite
4. Implementeaza provider abstraction layer PRIMA (cel mai important pattern)
5. Apoi UI simplu (recorder + settings)
6. Testeaza cu OpenAI Whisper API (cel mai simplu de integrat)

### Prioritati
1. **Provider abstraction** - trebuie sa fie solid, totul depinde de el
2. **Settings UI cu provider swap** - core feature cerut explicit
3. **Recorder + transcribe flow** - MVP value
4. **Post-processing** - adauga valoare dar poate fi iterativ

### Gotchas
- ffmpeg trebuie instalat pe masina (nu vine cu npm)
- MediaRecorder API produce WebM by default in Chrome, poate varia per browser
- WebSocket in Next.js App Router necesita custom server sau library (socket.io / ws)
- Whisper local necesita Python - consider child_process spawn
- API keys trebuie encrypted in DB (nu plaintext)
- Audio files pot fi mari - streaming upload, nu buffer complet in memorie
- SQLite nu suporta concurrent writes bine - ok pentru single-user MVP

### Ce NU trebuie facut in MVP
- Nu face mobile app
- Nu face multi-user/auth
- Nu face fine-tuning
- Nu face ambient listening
- Nu face integrari externe (EHR, CRM)
- Nu face analytics complex
