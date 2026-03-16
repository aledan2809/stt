// STT Module - Provider Abstraction Layer
// Last Updated: 2026-03-12

import type { TranscriptResult, TranscribeOptions, ProviderCapabilities, ProviderConfig } from '@/types/stt';

export abstract class STTProvider {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract transcribe(audioBuffer: Buffer, options?: TranscribeOptions): Promise<TranscriptResult>;

  abstract getCapabilities(): ProviderCapabilities;

  abstract validateConfig(): Promise<{ valid: boolean; error?: string }>;

  protected getApiKey(): string {
    if (!this.config.apiKey) {
      throw new Error(`API key not configured for ${this.getCapabilities().name}`);
    }
    return this.config.apiKey;
  }
}
