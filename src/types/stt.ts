// STT Module - Type Definitions
// Last Updated: 2026-03-12

export interface TranscriptResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
  wordCount?: number;
  timestamps?: TimestampSegment[];
  metadata?: Record<string, any>;
}

export interface TimestampSegment {
  start: number;
  end: number;
  text: string;
  confidence?: number;
}

export interface TranscribeOptions {
  language?: string;
  includeTimestamps?: boolean;
  model?: string;
  temperature?: number;
  prompt?: string;
}

export interface ProviderCapabilities {
  name: string;
  supportsRealtime: boolean;
  supportsTimestamps: boolean;
  supportedLanguages: string[];
  maxFileSize?: number;
  requiresApiKey: boolean;
}

export interface ProviderConfig {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  timeout?: number;
}

export type STTProvider = 'openai-whisper' | 'deepgram' | 'vatis-tech' | 'whisper-local';
export type TranscriptionStatus = 'processing' | 'completed' | 'failed';
