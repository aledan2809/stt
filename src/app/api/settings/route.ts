// STT Module - Settings API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sttManager, type SupportedProvider } from '@/lib/stt/manager';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const providerConfigSchema = z.object({
  provider: z.enum(['openai-whisper', 'deepgram', 'vatis-tech', 'whisper-local']),
  config: z.object({
    apiKey: z.string().optional(),
    model: z.string().optional(),
    baseUrl: z.string().optional(),
    timeout: z.number().optional(),
  }),
});

const activeProviderSchema = z.object({
  provider: z.enum(['openai-whisper', 'deepgram', 'vatis-tech', 'whisper-local']),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const setting = await prisma.setting.findUnique({
        where: { key },
      });

      if (!setting) {
        return NextResponse.json(
          { error: 'Setting not found' },
          { status: 404 }
        );
      }

      const value = setting.encrypted ? '***' : JSON.parse(setting.value);

      return NextResponse.json({
        key: setting.key,
        value,
        encrypted: setting.encrypted,
      });
    }

    const settings = await prisma.setting.findMany();

    const sanitizedSettings = settings.map((setting) => ({
      key: setting.key,
      value: setting.encrypted ? '***' : JSON.parse(setting.value),
      encrypted: setting.encrypted,
      updatedAt: setting.updatedAt,
    }));

    return NextResponse.json({ settings: sanitizedSettings });
  } catch (error: any) {
    console.error('GET settings error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'set-active-provider') {
      const { provider } = activeProviderSchema.parse(body);
      await sttManager.setActiveProvider(provider);

      return NextResponse.json({
        success: true,
        message: `Active provider set to ${provider}`,
      });
    }

    if (action === 'configure-provider') {
      const { provider, config } = providerConfigSchema.parse(body);
      await sttManager.saveProviderConfig(provider, config, true);

      return NextResponse.json({
        success: true,
        message: `Provider ${provider} configured successfully`,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('PUT settings error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
