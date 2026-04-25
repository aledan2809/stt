// STT Module - AI Text Processing API Route (via AIRouter)
// Handles text-based AI calls: summarization, analysis, etc.
// Audio STT calls remain on direct provider SDKs.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { aiRouter } from '@/lib/ai-router';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import type { AIMessage } from 'ai-router';

const TASK_HINTS = [
  'generation',
  'analysis',
  'summarization',
  'classification',
  'extraction',
  'conversation',
  'translation',
  'code',
] as const;

const aiRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ).min(1),
  taskHint: z.enum(TASK_HINTS).optional(),
  languageHint: z.enum(['ro', 'en', 'eu', 'international']).optional().default('ro'),
  maxTokens: z.number().int().positive().max(4096).optional(),
  temperature: z.number().min(0).max(2).optional(),
  jsonMode: z.boolean().optional(),
});

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = aiRequestSchema.parse(body);

    const response = await aiRouter.chat({
      messages: validated.messages as AIMessage[],
      taskHint: validated.taskHint,
      languageHint: validated.languageHint,
      maxTokens: validated.maxTokens,
      temperature: validated.temperature,
      jsonMode: validated.jsonMode,
    });

    return NextResponse.json({
      content: response.content,
      provider: response.provider,
      model: response.model,
      tokenUsage: response.tokenUsage,
      latencyMs: response.latencyMs,
    });
  } catch (error) {
    console.error('AI route error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(rateLimiters.general, handlePOST);
