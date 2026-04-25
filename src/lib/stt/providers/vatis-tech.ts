// STT Module - Vatis Tech Provider
// Last Updated: 2026-03-12

import type { TranscriptResult, TranscribeOptions, ProviderCapabilities, ProviderConfig } from '@/types/stt';
import { STTProvider } from '../provider';

interface VatisTranscriptionResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  text?: string;
  confidence?: number;
  duration?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  error?: string;
}

export class VatisTechProvider extends STTProvider {
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.vatis.tech/v1';
  }

  async transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptResult> {
    try {
      const formData = new FormData();
      const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('language', options?.language || 'ro');

      if (options?.model) {
        formData.append('model', options.model);
      }

      const response = await fetch(`${this.baseUrl}/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Vatis Tech API error: ${response.status}`);
      }

      const data: VatisTranscriptionResponse = await response.json();

      if (data.status === 'failed' || data.error) {
        throw new Error(data.error || 'Transcription failed');
      }

      if (data.status === 'pending' || data.status === 'processing') {
        const result = await this.pollForResult(data.id);
        return this.formatResult(result, options);
      }

      return this.formatResult(data, options);
    } catch (error) {
      throw new Error(`Vatis Tech transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async pollForResult(transcriptionId: string, maxAttempts = 60): Promise<VatisTranscriptionResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch(`${this.baseUrl}/transcribe/${transcriptionId}`, {
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
      });

      if (!response.ok) {
        continue;
      }

      const data: VatisTranscriptionResponse = await response.json();

      if (data.status === 'completed') {
        return data;
      }

      if (data.status === 'failed') {
        throw new Error(data.error || 'Transcription failed');
      }
    }

    throw new Error('Transcription timed out');
  }

  private formatResult(data: VatisTranscriptionResponse, options?: TranscribeOptions): TranscriptResult {
    const result: TranscriptResult = {
      text: data.text || '',
      confidence: data.confidence,
      language: options?.language || 'ro',
      duration: data.duration,
    };

    if (options?.includeTimestamps && data.words) {
      result.timestamps = data.words.map(word => ({
        start: word.start,
        end: word.end,
        text: word.word,
        confidence: word.confidence,
      }));
    }

    result.wordCount = result.text.split(/\s+/).filter(Boolean).length;

    return result;
  }

  getCapabilities(): ProviderCapabilities {
    return {
      name: 'Vatis Tech',
      supportsRealtime: true,
      supportsTimestamps: true,
      supportedLanguages: ['ro', 'en'],
      maxFileSize: 500 * 1024 * 1024, // 500MB
      requiresApiKey: true,
    };
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    try {
      if (!this.config.apiKey) {
        return { valid: false, error: 'API key is required' };
      }

      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.getApiKey()}`,
        },
      });

      if (!response.ok) {
        return { valid: false, error: `API validation failed: ${response.status}` };
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
