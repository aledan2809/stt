
## 🔍 Introspection Audit 2026-06-20
> Audit complet (gap strategie↔cod · ghid per-pagină · deep research · funcțional + cyber).
> 4 acțiuni deschise · 🔴 2 critice (librărie/local — fără scor extern).
> Rapoarte: `Reports/INTROSPECTION-2026-06-20/` (00-SUMMARY.md, 01-gap-strategy-vs-code.md, 02-pages-guide-RO.md, 03-deep-research-optimization.md, 04b-security-audit.md)
> Checklist Alex centralizat: `Master/reports/Alex_TODO_2026-06-20.md` + tab „Introspection Audit" în UI Master.

## STT (local, dictare medicală) — ACTIVE (fix-urile așteaptă review)
Sursă: `STT/Reports/INTROSPECTION-2026-06-20/`

- [ ] 🔴 **Vocabularul medical NU se trimite la provideri** (`prompt`/`keyterm` necompletate în `transcribe/route.ts`, `deepgram.ts`) → „acuratețea medicală" e INERTĂ azi. + Deepgram hardcodat `nova-2` (nu `nova-3-medical`).
  - 🗣️ *Pe înțelesul tău:* Termenii medicali nu ajung la motorul de transcriere, deci „acuratețea medicală" promisă nu funcționează azi. După fix, dictarea recunoaște corect termenii medicali.
- [ ] 🔴 **Transcripte (GDPR Art.9 sănătate) stocate plaintext** în SQLite necriptat (deși CONTEXT promite criptare-at-rest) + **fără AuditLog** + activează criptare disk pe `data/`.
  - 🗣️ *Pe înțelesul tău:* Transcrierile medicale (date de sănătate, foarte sensibile) sunt stocate necriptate, deși s-a promis criptare. După fix, sunt criptate pe disc și ai jurnal de acces.
- [ ] 🟡 **Parolă SHA-256 fără salt** (G-STT-005) + app deschis-by-default fără parolă + `npm audit fix` (3 high `ws`).
  - 🗣️ *Pe înțelesul tău:* Parolele sunt protejate slab și aplicația e deschisă fără parolă implicit. După fix, parolele sunt securizate corect și accesul cere autentificare.
- [ ] 🟡 **Streaming = stub 501** (UI sugerează live) + retenție/auto-delete audio necablate + șterge `.env.bak-2026-05-16-rotation`.
  - 🗣️ *Pe înțelesul tău:* Dictarea „live" promisă de interfață nu e implementată și fișierele audio nu se șterg automat. După fix, ori marchezi clar că nu e live, ori o construiești, plus audio-ul vechi se șterge singur.
- _Solid: chei server-side, `.env` netracked, AES-256 key encryption, auth+rate-limit+headere, path-traversal guard._

---
