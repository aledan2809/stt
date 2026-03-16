// STT Module - OpenAI Whisper Provider
// Last Updated: 2026-03-12

import OpenAI from 'openai';
import type { TranscriptResult, TranscribeOptions, ProviderCapabilities, ProviderConfig } from '@/types/stt';
import { STTProvider } from '../provider';

export class OpenAIWhisperProvider extends STTProvider {
  private client: OpenAI;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = new OpenAI({
      apiKey: this.getApiKey(),
      baseURL: config.baseUrl,
      timeout: config.timeout || 60000,
    });
  }

  async transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptResult> {
    try {
      const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
      const file = new File([blob], 'audio.wav', { type: 'audio/wav' });

      const response = await this.client.audio.transcriptions.create({
        file,
        model: options?.model || this.config.model || 'whisper-1',
        language: options?.language || 'ro',
        temperature: options?.temperature || 0,
        prompt: options?.prompt,
        response_format: options?.includeTimestamps ? 'verbose_json' : 'json',
      });

      const text = typeof response === 'string' ? response : response.text;

      const result: TranscriptResult = {
        text,
        language: options?.language || 'ro',
      };

      if (typeof response === 'object' && 'duration' in response) {
        result.duration = response.duration as number;
      }

      if (typeof response === 'object' && 'segments' in response && options?.includeTimestamps) {
        const segments = (response as { segments?: Array<{ start: number; end: number; text: string }> }).segments;
        if (segments) {
          result.timestamps = segments.map((seg) => ({
            start: seg.start,
            end: seg.end,
            text: seg.text,
          }));
        }
      }

      result.wordCount = text.split(/\s+/).filter(Boolean).length;

      return result;
    } catch (error: any) {
      throw new Error(`OpenAI Whisper transcription failed: ${error.message}`);
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      name: 'OpenAI Whisper',
      supportsRealtime: false,
      supportsTimestamps: true,
      supportedLanguages: ['ro', 'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'],
      maxFileSize: 25 * 1024 * 1024, // 25MB
      requiresApiKey: true,
    };
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.config.apiKey) {
        return { valid: false, error: 'API key is required' };
      }

      await this.client.models.list();

      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'Failed to validate API key'
      };
    }
  }
}
