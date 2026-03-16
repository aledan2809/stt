// STT Module - Whisper Local Provider (faster-whisper via local HTTP server)
// Last Updated: 2026-03-16

import type { TranscriptResult, TranscribeOptions, ProviderCapabilities, ProviderConfig } from '@/types/stt';
import { STTProvider } from '../provider';

interface WhisperLocalResponse {
  text: string;
  language: string;
  language_probability: number;
  duration: number;
  processing_time: number;
  model: string;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  error?: string;
}

export class WhisperLocalProvider extends STTProvider {
  private serverUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.serverUrl = config.baseUrl || 'http://127.0.0.1:8787';
  }

  async transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptResult> {
    try {
      const language = options?.language || 'ro';
      const timestamps = options?.includeTimestamps ? 'true' : 'false';

      // Detect audio format from buffer magic bytes
      let contentType = 'audio/wav';
      if (audioBuffer[0] === 0x1A && audioBuffer[1] === 0x45) {
        contentType = 'audio/webm'; // WebM/MKV
      } else if (audioBuffer[0] === 0x4F && audioBuffer[1] === 0x67) {
        contentType = 'audio/ogg'; // OGG
      } else if (audioBuffer[0] === 0xFF && (audioBuffer[1] & 0xE0) === 0xE0) {
        contentType = 'audio/mpeg'; // MP3
      } else if (audioBuffer[4] === 0x66 && audioBuffer[5] === 0x74) {
        contentType = 'audio/mp4'; // M4A/MP4
      }

      const response = await fetch(
        `${this.serverUrl}/transcribe?language=${language}&timestamps=${timestamps}`,
        {
          method: 'POST',
          headers: { 'Content-Type': contentType },
          body: new Uint8Array(audioBuffer),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Whisper local server error: ${response.status}`);
      }

      const data: WhisperLocalResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const result: TranscriptResult = {
        text: data.text,
        language: data.language,
        duration: data.duration,
        wordCount: data.text.split(/\s+/).filter(Boolean).length,
        metadata: {
          model: data.model,
          processingTime: data.processing_time,
          languageProbability: data.language_probability,
        },
      };

      if (options?.includeTimestamps && data.segments) {
        result.timestamps = data.segments.map((seg) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        }));
      }

      return result;
    } catch (error: any) {
      if (error.cause?.code === 'ECONNREFUSED') {
        throw new Error(
          'Whisper local server not running. Start it with: whisper\\start-whisper.bat'
        );
      }
      throw new Error(`Whisper local transcription failed: ${error.message}`);
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      name: 'Whisper Local (faster-whisper)',
      supportsRealtime: false,
      supportsTimestamps: true,
      supportedLanguages: ['ro', 'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'],
      maxFileSize: 500 * 1024 * 1024, // 500MB
      requiresApiKey: false,
    };
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.serverUrl}/health`);

      if (!response.ok) {
        return { valid: false, error: `Server responded with status ${response.status}` };
      }

      const data = await response.json();
      if (!data.ready) {
        return { valid: false, error: 'Model not loaded yet' };
      }

      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: 'Whisper server not running. Start it with: whisper\\start-whisper.bat',
      };
    }
  }

  protected getApiKey(): string {
    return 'local'; // No API key needed
  }
}
