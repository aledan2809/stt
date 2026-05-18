// STT Module - Test Provider API Route
// Last Updated: 2026-03-12

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sttManager } from '@/lib/stt/manager';
import { withRateLimit, RateLimiter } from '@/lib/rate-limit';

const testProviderSchema = z.object({
  provider: z.enum(['openai-whisper', 'deepgram', 'vatis-tech', 'whisper-local']),
});

const testRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 3,
  message: 'Prea multe teste de conexiune. Încearc din nou în 1 minut.',
});

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = testProviderSchema.parse(body);

    const result = await sttManager.testProviderConnection(provider);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Successfully connected to ${provider}`,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Connection test failed',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Test provider error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to test provider connection' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(testRateLimiter, handlePOST);
