// STT Module - Provider Manager
// Last Updated: 2026-03-12

import { prisma } from '@/lib/db';
import { encrypt, decrypt, isEncrypted } from '@/lib/crypto';
import { STTProvider } from './provider';
import { OpenAIWhisperProvider } from './providers/openai-whisper';
import { DeepgramProvider } from './providers/deepgram';
import { VatisTechProvider } from './providers/vatis-tech';
import { WhisperLocalProvider } from './providers/whisper-local';
import type { ProviderConfig, ProviderCapabilities } from '@/types/stt';

export type SupportedProvider = 'openai-whisper' | 'deepgram' | 'vatis-tech' | 'whisper-local';

export class STTManager {
  private static instance: STTManager;
  private providerCache = new Map<SupportedProvider, STTProvider>();

  private constructor() {}

  static getInstance(): STTManager {
    if (!STTManager.instance) {
      STTManager.instance = new STTManager();
    }
    return STTManager.instance;
  }

  async getProvider(providerName: SupportedProvider): Promise<STTProvider> {
    if (this.providerCache.has(providerName)) {
      return this.providerCache.get(providerName)!;
    }

    const config = await this.getProviderConfig(providerName);
    const provider = this.createProvider(providerName, config);

    this.providerCache.set(providerName, provider);
    return provider;
  }

  async getActiveProvider(): Promise<{ provider: STTProvider; name: SupportedProvider }> {
    const activeSetting = await prisma.setting.findUnique({
      where: { key: 'active_provider' },
    });

    const activeProviderName = (activeSetting?.value || 'openai-whisper') as SupportedProvider;
    const provider = await this.getProvider(activeProviderName);

    return { provider, name: activeProviderName };
  }

  async setActiveProvider(providerName: SupportedProvider): Promise<void> {
    await prisma.setting.upsert({
      where: { key: 'active_provider' },
      update: { value: providerName },
      create: { key: 'active_provider', value: providerName, encrypted: false },
    });

    this.providerCache.clear();
  }

  async getProviderConfig(providerName: SupportedProvider): Promise<ProviderConfig> {
    const setting = await prisma.setting.findUnique({
      where: { key: `provider_${providerName}` },
    });

    if (setting) {
      const config = JSON.parse(setting.value);
      if (setting.encrypted && config.apiKey) {
        config.apiKey = decrypt(config.apiKey);
      }
      return config;
    }

    // Fallback: check environment variables
    // whisper-local needs no API key — just a server URL
    if (providerName === 'whisper-local') {
      return { baseUrl: process.env.WHISPER_LOCAL_URL || 'http://127.0.0.1:8787' };
    }

    const envKeyMap: Record<string, string> = {
      'openai-whisper': 'OPENAI_API_KEY',
      'deepgram': 'DEEPGRAM_API_KEY',
      'vatis-tech': 'VATIS_TECH_API_KEY',
    };

    const envKey = process.env[envKeyMap[providerName]];
    if (envKey) {
      return { apiKey: envKey };
    }

    throw new Error(`Provider ${providerName} is not configured`);
  }

  async saveProviderConfig(
    providerName: SupportedProvider,
    config: ProviderConfig,
    encryptApiKey = true
  ): Promise<void> {
    const configToSave = { ...config };

    if (encryptApiKey && config.apiKey) {
      configToSave.apiKey = encrypt(config.apiKey);
    }

    await prisma.setting.upsert({
      where: { key: `provider_${providerName}` },
      update: {
        value: JSON.stringify(configToSave),
        encrypted: encryptApiKey && !!config.apiKey,
      },
      create: {
        key: `provider_${providerName}`,
        value: JSON.stringify(configToSave),
        encrypted: encryptApiKey && !!config.apiKey,
      },
    });

    this.providerCache.delete(providerName);
  }

  async testProviderConnection(providerName: SupportedProvider): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const provider = await this.getProvider(providerName);
      const validation = await provider.validateConfig();

      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  getAllProviderCapabilities(): Record<SupportedProvider, ProviderCapabilities> {
    return {
      'openai-whisper': new OpenAIWhisperProvider({ apiKey: 'dummy' }).getCapabilities(),
      'deepgram': new DeepgramProvider({ apiKey: 'dummy' }).getCapabilities(),
      'vatis-tech': new VatisTechProvider({ apiKey: 'dummy' }).getCapabilities(),
      'whisper-local': new WhisperLocalProvider({}).getCapabilities(),
    };
  }

  private createProvider(providerName: SupportedProvider, config: ProviderConfig): STTProvider {
    switch (providerName) {
      case 'openai-whisper':
        return new OpenAIWhisperProvider(config);
      case 'deepgram':
        return new DeepgramProvider(config);
      case 'vatis-tech':
        return new VatisTechProvider(config);
      case 'whisper-local':
        return new WhisperLocalProvider(config);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }
}

export const sttManager = STTManager.getInstance();
