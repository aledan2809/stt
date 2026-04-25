// STT Module - Deepgram Provider
// Last Updated: 2026-03-12

import { createClient } from '@deepgram/sdk';
import type { TranscriptResult, TranscribeOptions, ProviderCapabilities, ProviderConfig } from '@/types/stt';
import { STTProvider } from '../provider';

export class DeepgramProvider extends STTProvider {
  private client: ReturnType<typeof createClient>;

  constructor(config: ProviderConfig) {
    super(config);
    this.client = createClient(this.getApiKey());
  }

  async transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptResult> {
    try {
      const { result, error } = await this.client.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: options?.model || this.config.model || 'nova-2',
          language: options?.language || 'ro',
          punctuate: true,
          diarize: false,
          smart_format: true,
        }
      );

      if (error) {
        throw new Error(`Deepgram transcription error: ${error.message}`);
      }

      const transcript = result.results?.channels[0]?.alternatives[0];
      if (!transcript) {
        throw new Error('No transcription results returned from Deepgram');
      }

      const transcriptResult: TranscriptResult = {
        text: transcript.transcript,
        confidence: transcript.confidence,
        language: options?.language || 'ro',
      };

      if (result.metadata?.duration) {
        transcriptResult.duration = result.metadata.duration;
      }

      if (options?.includeTimestamps && transcript.words) {
        transcriptResult.timestamps = transcript.words.map((word: { start: number; end: number; word: string; confidence: number }) => ({
          start: word.start,
          end: word.end,
          text: word.word,
          confidence: word.confidence,
        }));
      }

      transcriptResult.wordCount = transcript.transcript.split(/\s+/).filter(Boolean).length;

      return transcriptResult;
    } catch (error) {
      throw new Error(`Deepgram transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      name: 'Deepgram Nova-2',
      supportsRealtime: true,
      supportsTimestamps: true,
      supportedLanguages: ['ro', 'en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ja', 'ko', 'zh'],
      maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
      requiresApiKey: true,
    };
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.config.apiKey) {
        return { valid: false, error: 'API key is required' };
      }

      const { result, error } = await this.client.manage.getProjects();

      if (error) {
        return { valid: false, error: error.message };
      }

      if (!result) {
        return { valid: false, error: 'Failed to validate API key' };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to validate API key'
      };
    }
  }
}
