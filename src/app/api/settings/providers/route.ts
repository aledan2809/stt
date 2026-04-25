// STT Module - List Providers API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { sttManager } from '@/lib/stt/manager';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    const capabilities = sttManager.getAllProviderCapabilities();

    const activeSetting = await prisma.setting.findUnique({
      where: { key: 'active_provider' },
    });
    const activeProvider = activeSetting?.value || 'openai-whisper';

    const envKeyMap: Record<string, string> = {
      'openai-whisper': 'OPENAI_API_KEY',
      'deepgram': 'DEEPGRAM_API_KEY',
      'vatis-tech': 'VATIS_TECH_API_KEY',
    };

    const configuredProviders: string[] = [];
    for (const providerName of Object.keys(capabilities)) {
      // whisper-local needs no API key — always configured
      if (providerName === 'whisper-local') {
        configuredProviders.push(providerName);
        continue;
      }
      const setting = await prisma.setting.findUnique({
        where: { key: `provider_${providerName}` },
      });
      if (setting) {
        configuredProviders.push(providerName);
      } else if (envKeyMap[providerName] && process.env[envKeyMap[providerName]]) {
        configuredProviders.push(providerName);
      }
    }

    const providers = Object.entries(capabilities).map(([key, caps]) => ({
      id: key,
      name: caps.name,
      capabilities: caps,
      isActive: key === activeProvider,
      isConfigured: configuredProviders.includes(key),
    }));

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('GET providers error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve providers' },
      { status: 500 }
    );
  }
}
