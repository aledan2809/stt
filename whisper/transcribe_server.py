"""
Faster-Whisper local transcription HTTP server.
Runs on port 8787. Used by STT Module's whisper-local provider.

Usage:
    python transcribe_server.py [--model small] [--device cpu] [--port 8787]

Models (speed vs accuracy for Romanian):
    tiny   - ~1GB RAM, fastest, ~70% accuracy
    base   - ~1GB RAM, fast, ~75% accuracy
    small  - ~2GB RAM, balanced, ~82% accuracy (default)
    medium - ~5GB RAM, slower, ~88% accuracy
    large-v3 - ~10GB RAM, slowest, ~92% accuracy
"""

import argparse
import json
import os
import sys
import tempfile
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import io

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("ERROR: faster-whisper not installed.")
    print("Run: pip install faster-whisper")
    sys.exit(1)

# Global model reference
model = None
model_name = "small"


def load_model(name: str, device: str = "cpu", compute_type: str = "int8"):
    global model, model_name
    model_name = name
    print(f"Loading model '{name}' on {device} ({compute_type})...")
    start = time.time()
    model = WhisperModel(name, device=device, compute_type=compute_type)
    print(f"Model loaded in {time.time() - start:.1f}s")


class TranscribeHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/health":
            self._json_response(200, {
                "status": "ok",
                "model": model_name,
                "ready": model is not None,
            })
        else:
            self._json_response(404, {"error": "Not found"})

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == "/shutdown":
            self._json_response(200, {"status": "shutting_down"})
            import threading
            threading.Thread(target=lambda: (time.sleep(0.5), os._exit(0))).start()
            return

        if parsed.path != "/transcribe":
            self._json_response(404, {"error": "Not found"})
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            if content_length == 0:
                self._json_response(400, {"error": "No audio data"})
                return

            # Read audio data
            audio_data = self.rfile.read(content_length)

            # Parse query params
            params = parse_qs(urlparse(self.path).query)
            language = params.get("language", ["ro"])[0]
            include_timestamps = params.get("timestamps", ["false"])[0] == "true"

            # Detect format from content type header
            content_type = self.headers.get("Content-Type", "")
            ext_map = {
                "audio/webm": ".webm",
                "audio/ogg": ".ogg",
                "audio/mpeg": ".mp3",
                "audio/mp3": ".mp3",
                "audio/mp4": ".m4a",
                "audio/m4a": ".m4a",
                "audio/x-wav": ".wav",
                "audio/wav": ".wav",
            }
            suffix = ext_map.get(content_type, ".wav")

            # Write to temp file (faster-whisper needs file path)
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name

            try:
                start = time.time()
                segments, info = model.transcribe(
                    tmp_path,
                    language=language if language != "auto" else None,
                    beam_size=5,
                    vad_filter=True,
                    vad_parameters=dict(min_silence_duration_ms=500),
                )

                # Collect segments
                all_segments = []
                full_text_parts = []
                for segment in segments:
                    all_segments.append({
                        "start": round(segment.start, 2),
                        "end": round(segment.end, 2),
                        "text": segment.text.strip(),
                    })
                    full_text_parts.append(segment.text.strip())

                full_text = " ".join(full_text_parts)
                duration = time.time() - start

                response = {
                    "text": full_text,
                    "language": info.language,
                    "language_probability": round(info.language_probability, 3),
                    "duration": round(info.duration, 2),
                    "processing_time": round(duration, 2),
                    "model": model_name,
                }

                if include_timestamps:
                    response["segments"] = all_segments

                self._json_response(200, response)
            finally:
                os.unlink(tmp_path)

        except Exception as e:
            self._json_response(500, {"error": str(e)})

    def _json_response(self, status: int, data: dict):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        print(f"[whisper] {args[0]}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Faster-Whisper local STT server")
    parser.add_argument("--model", default="small", help="Model size (tiny/base/small/medium/large-v3)")
    parser.add_argument("--device", default="cpu", help="Device (cpu/cuda)")
    parser.add_argument("--compute-type", default="int8", help="Compute type (int8/float16/float32)")
    parser.add_argument("--port", type=int, default=8787, help="HTTP port")
    args = parser.parse_args()

    load_model(args.model, args.device, args.compute_type)

    server = HTTPServer(("127.0.0.1", args.port), TranscribeHandler)
    print(f"Whisper server ready on http://127.0.0.1:{args.port}")
    print(f"  Model: {args.model} | Device: {args.device} | Compute: {args.compute_type}")
    print(f"  POST /transcribe?language=ro&timestamps=true")
    print(f"  GET  /health")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.server_close()
