# Speech-to-Text Research Report - Limba Romana

## Changelog
- [2026-03-12] v1.0: Raport initial complet - provideri, costuri, arhitectura, open-source

---

## 1. Provideri STT cu suport Romanian

### Tabel comparativ

| Provider | Pret/minut | Real-time | Batch | Calitate RO | Medical | Diarization |
|---|---|---|---|---|---|---|
| **Vatis Tech** (RO) | $0.00625 | Da (420ms) | Da | **97%** (best) | Testat medical | Da |
| **GPT-4o Mini Transcribe** | $0.003 | Nu | Da | Buna | Nu | Nu |
| **Deepgram Nova-2/3** | $0.0043 batch / $0.0058 stream | Da | Da | Buna | Custom vocab | Da |
| **OpenAI Whisper API** | $0.006 | Nu | Da | ~85-88% | Nu | Nu |
| **GPT-4o Transcribe** | $0.006 | Nu | Da | Mai buna ca Whisper | Nu | Da |
| **Azure Speech** | $0.006 batch / $0.017 real-time | Da | Da | Buna | Custom models | Da |
| **Google Cloud STT** | $0.003 dynamic batch / $0.024 standard | Da | Da | Medie | Nu specific RO | Da |
| **AWS Transcribe** | $0.024 (vol. discount la $0.0078) | Da | Da | Buna | Doar EN ($0.075/min) | Da |
| **AssemblyAI** | ~$0.015 | Da | Da | Neconfirmat RO | Nu | Da |
| **Speechmatics** | Custom pricing | Da | Da | Da | Enterprise | Da |

### Detalii per provider

#### Vatis Tech (Recomandat #1 pentru romana)
- **Companie romaneasca**, purpose-built pentru romana
- 97% accuracy pe romana (benchmark vs Google si Speechmatics)
- Real-time API la 420ms latenta
- Testat pe domeniu medical
- 60 minute gratuite la start
- GDPR-friendly (companie din RO/EU)
- Pret: $0.00625/min

#### Deepgram Nova-2/3
- Cel mai bun raport pret-performanta global
- Romanian adaugat Mai 2024 (36 limbi)
- Speaker diarization, punctuatie, custom vocabulary nativ
- $200 credit gratuit pentru conturi noi
- Factureaza pe secunda exacta (nu rotunjeste)
- Pret: $0.0043/min batch, $0.0058/min streaming

#### OpenAI Whisper API
- Cheapest major cloud API la $0.006/min
- 25MB file size limit (~30 min per fisier)
- Fara real-time streaming
- 57+ limbi inclusiv romana
- GPT-4o Transcribe: mai bun decat Whisper, include diarization

#### GPT-4o Mini Transcribe
- Cel mai ieftin: $0.003/min
- Batch only
- Calitate usor mai mica decat GPT-4o full
- Ideal pentru post-processing/re-transcriptie

#### Azure Speech Services
- Custom model training disponibil (util pentru vocabular medical) - $0.048/min training
- Romana confirmata
- Speaker diarization disponibil
- Commitment pricing: $0.50/ora la 50K ore/an
- BAA disponibil (HIPAA compliant)

#### Google Cloud STT
- Dynamic Batch la $0.003/min (delay 24h)
- 60 min/luna gratuit + $300 credit cont nou
- Romana suportata dar underperforms vs modele specializate
- Medical model nu e specific RO

#### AWS Transcribe
- Volume discounts agresive: $0.0078/min la 5M+ minute
- Medical Transcription dedicat dar doar English ($0.075/min)
- Speaker diarization inclus

---

## 2. Costuri estimate pe volume

| Volum lunar | Abordare recomandata | Cost estimat/luna |
|---|---|---|
| < 100 ore | GPT-4o Mini Transcribe API ($0.003/min) | ~$18 |
| 100-500 ore | Deepgram batch ($0.0043/min) | $26-130 |
| 500-3,000 ore | Deepgram Growth plan sau Azure batch | $150-1,080 |
| 3,000+ ore | Self-hosted Whisper pe GPU | ~$500 |
| 10,000+ ore | Self-hosted Whisper + batch processing | ~$1,000 |

### Break-even self-hosted vs API
- ~3,000 ore/luna (incluzand infrastructura + DevOps overhead)
- Self-hosted effective cost: ~$0.03/ora de audio
- 1 ora audio procesata in ~2 minute pe GPU bun (A100/RTX 4090)

### Cost optimization strategies
- **Deepgram** factureaza pe secunda exacta (nu rotunjeste) - economie pe clipuri scurte
- **Google Dynamic Batch** la $0.003/min daca delay-ul de 24h e acceptabil
- **AWS** volume discounts sunt cele mai agresive: $0.0078/min la 5M+ minute
- **Azure** commitment pricing: $0.50/ora la 50K ore/an

---

## 3. Open Source & Modele pentru Romana

### Modele disponibile

| Model | Baza | Dataset | Nota |
|---|---|---|---|
| **gigant/whisper-medium-romanian** | Whisper Medium | Common Voice 11.0 + Romanian Speech Synthesis Corpus | Cel mai bun fine-tune comunitar |
| **readerbench/whisper-ro** | Whisper Small | Echo dataset (corpus mare RO) | De la ReadBench (cercetare RO) |
| **Artanis1551/whisper_romanian** | Whisper Small | Romanian Voice 1.0 | Contributie comunitate |
| **FastConformer RO (Nov 2025)** | NVIDIA FastConformer 110M param | 2600+ ore speech RO | **27% reducere WER** vs previous best |
| **RobinASR** (RACAI) | DeepSpeech2 + KenLM | Date academice RO | De la Academia Romana |
| **gigant/romanian-wav2vec2** | wav2vec2-xls-r-300m | Common Voice 8.0 RO | Arhitectura alternativa |

### Framework-uri open source

| Proiect | Status | Romanian? | Real-time? | Nota |
|---|---|---|---|---|
| **OpenAI Whisper** | Activ | Da (built-in) | Nu (batch) | Best accuracy, multiple model sizes |
| **faster-whisper** | Activ | Da | Da (cu VAD) | **4x mai rapid**, CTranslate2 backend |
| **whisper.cpp** | Activ | Da | Da (streaming) | C/C++, ruleaza pe CPU, RPi, mobile |
| **Vosk** | Activ | Nu nativ | Da | Modele mici 50MB, mobile |
| **Mozilla DeepSpeech** | **Deprecat** | Nu | - | NU construi pe el |
| **Coqui STT** | **Inchis (Ian 2024)** | Nu | - | NU construi pe el |

### Whisper fine-tuning pentru romana
- Fine-tuning complet suportat via HuggingFace Transformers
- Whisper prezice UTF-8 bytecodes direct - nu necesita update vocabular
- Doar layere specifice necesita actualizare pentru termeni de domeniu
- Paper IEEE: modelele fine-tuned merg bine pe speech standard dar au probleme cu copii, varstnici, unele voci feminine (WER se dubleaza)

---

## 4. Consideratii specifice limba romana

### Diacritice (a, a, i, s, t)
- Sistemele STT moderne includ module de post-processing pentru restaurare diacritice
- Task NLP non-trivial - necesita context ("casa" vs "casa")
- Cercetare Politehnica Bucuresti (lab SpeeD): 6 arhitecturi RNN comparate
- Vatis Tech gestioneaza diacriticele nativ
- Whisper large-v3 produce text cu diacritice dar accuracy variaza

### Terminologie medicala romaneasca
- **Nu exista model STT medical romanesc off-the-shelf**
- Cel mai bun approach: fine-tune Whisper large-v3 pe corpus medical audio RO
- Alternativa: Vatis Tech + custom vocabulary boosting
- Termeni dentari de antrenat: radiografie panoramica, detartraj, obturatie, extractie, proteza dentara, gingivita, periodontita, canal radicular, coroana dentara, implant dentar, endodontie, parodontologie

---

## 5. Use Cases pe industrii

### Stomatologie (cel mai mare potential)
- **Hands-free obligatoriu** - dentistul nu poate tasta in timpul procedurii
- Produse existente: Alta AI, Denti.AI Voice Perio, VoiceboxMD, Dentrix Voice
- ROI: 10+ ore/saptamana economisite, 85% mai rapid decat tastarea
- Elimina nevoia de asistenta care noteaza dictarea

### Medical general
- **Ambient clinical intelligence** - AI asculta conversatia si genereaza note
- Dragon Medical One (Nuance/Microsoft): 99% accuracy, 200+ integrari EHR
- DAX Copilot: 50% mai putin timp documentatie, 7 min economisite/consultatie
- Lancet 2025: AI voice-to-text imbunatateste calitatea ingrijirii in ambulatoriu

### Legal
- Criza de stenografi la nivel global
- ASR la 99% accuracy, hybrid cu digital reporter
- Vocabular specific: citatii, termeni latini, nomenclatura juridica

### Call Center
- Real-time coaching, compliance monitoring
- 100% call scoring (vs 2-5% sampling traditional)
- Post-call analytics, sentiment analysis, PII redaction

### Educatie
- Accesibilitate pentru studenti cu dizabilitati
- Live captioning in clase
- Note-taking automat din lectii

---

## 6. Compliance & Securitate

### GDPR (obligatoriu in Romania/EU)
- Date trebuie sa ramana in EU sau cu mecanisme de transfer adecvate
- Self-hosted Whisper rezolva complet problema
- Encriptie AES-256 end-to-end (transit + rest)
- Audit logs obligatorii pentru acces audio/transcript
- Breach notification: 72 ore

### HIPAA (relevant daca se exporta in US)
- BAA obligatoriu cu orice vendor care proceseaza audio clinic
- Provideri cu BAA: Deepgram, Azure, Google Cloud, AWS
- **OpenAI Whisper API NU ofera BAA**
- Encriptie, access controls, audit trails obligatorii

### On-premise deployment
- Self-hosted Whisper/faster-whisper: zero date parasesc infrastructura
- NVIDIA Riva: pipeline complet on-prem
- Docker containers pentru deployment izolat
- Ideal pentru clinici care nu vor date in cloud

---

## 7. Referinte & Surse

### Provideri
- Deepgram: deepgram.com/learn/speech-to-text-api-pricing-breakdown-2025
- Vatis Tech: vatis.tech/blog/romanian-speech-to-text-benchmark-winter-2023
- OpenAI: openai.com/api/pricing/
- Azure: azure.microsoft.com/en-us/pricing/details/cognitive-services/speech-services/
- Google Cloud: cloud.google.com/speech-to-text/pricing
- AWS: aws.amazon.com/transcribe/pricing/

### Modele & Research
- Whisper large-v3: huggingface.co/openai/whisper-large-v3
- readerbench/whisper-ro: huggingface.co/readerbench/whisper-ro
- gigant/whisper-medium-romanian: huggingface.co/gigant/whisper-medium-romanian
- FastConformer RO: arxiv.org/abs/2511.03361
- RobinASR: github.com/racai-ai/RobinASR
- IEEE Romanian Whisper evaluation: ieeexplore.ieee.org/document/10314923

### Medical/Dental
- Speechmatics Medical: speechmatics.com/company/articles-and-news/speechmatics-sets-record-in-medical-speech-to-text-with-93-percent-accuracy
- Lancet 2025 Systematic Review: pmc.ncbi.nlm.nih.gov/articles/PMC12301838/
- DAX Copilot: news.nuance.com/2024-03-15-Nuance-Introduces-DAX-Copilot
- HIPAA-Compliant STT: emitrr.com/blog/hipaa-compliant-speech-to-text/
- Alta AI Dental: altavoice.ai/
- Denti.AI: denti.ai/voice
