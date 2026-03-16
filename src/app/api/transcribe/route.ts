// STT Module - Transcription API Route
// Last Updated: 2026-03-12

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sttManager } from '@/lib/stt/manager';
import type { TranscribeOptions } from '@/types/stt';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_AUDIO_TYPES = [
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/m4a',
  'audio/webm',
  'audio/ogg',
];

// Request validation schema
const transcribeSchema = z.object({
  language: z.string().optional().default('ro'),
  includeTimestamps: z.boolean().optional().default(false),
  model: z.string().optional(),
  provider: z.enum(['openai-whisper', 'deepgram', 'vatis-tech', 'whisper-local']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const optionsJson = formData.get('options') as string;

    // Validate audio file
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    if (!ALLOWED_AUDIO_TYPES.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Invalid audio type. Allowed: ${ALLOWED_AUDIO_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Parse and validate options
    const options = optionsJson ? JSON.parse(optionsJson) : {};
    const validatedOptions = transcribeSchema.parse(options);

    // Convert audio file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Get provider (use specified provider or active provider)
    let provider;
    let providerName;
    if (validatedOptions.provider) {
      provider = await sttManager.getProvider(validatedOptions.provider);
      providerName = validatedOptions.provider;
    } else {
      const active = await sttManager.getActiveProvider();
      provider = active.provider;
      providerName = active.name;
    }

    // Auto-start whisper-local server if needed
    if (providerName === 'whisper-local') {
      try {
        const health = await fetch('http://127.0.0.1:8787/health', {
          signal: AbortSignal.timeout(2000),
        });
        if (!health.ok) throw new Error('not ready');
      } catch {
        // Server not running — auto-start it
        const startRes = await fetch(`${new URL(request.url).origin}/api/whisper-server`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start' }),
        });
        const startData = await startRes.json();
        if (!startData.success) {
          return NextResponse.json(
            { error: `Whisper server nu a pornit: ${startData.error}` },
            { status: 500 }
          );
        }
        // Re-get provider (cache might be stale)
        provider = await sttManager.getProvider('whisper-local');
      }
    }

    // Perform transcription
    const transcribeOptions: TranscribeOptions = {
      language: validatedOptions.language,
      includeTimestamps: validatedOptions.includeTimestamps,
      model: validatedOptions.model,
    };

    const result = await provider.transcribe(audioBuffer, transcribeOptions);

    // Save to database
    const transcription = await prisma.transcription.create({
      data: {
        text: result.text,
        provider: providerName,
        model: validatedOptions.model || result.metadata?.model || 'default',
        language: result.language || validatedOptions.language,
        duration: result.duration,
        confidence: result.confidence,
        wordCount: result.wordCount,
        status: 'completed',
        metadata: result.timestamps ? JSON.stringify({ timestamps: result.timestamps }) : null,
      },
    });

    // Return response
    return NextResponse.json({
      id: transcription.id,
      text: result.text,
      language: result.language,
      duration: result.duration,
      wordCount: result.wordCount,
      timestamps: result.timestamps,
      createdAt: transcription.createdAt,
    });

  } catch (error) {
    console.error('Transcription error:', error);

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

// GET endpoint to retrieve transcriptions (list or by ID)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // If ID provided, return single transcription
    if (id) {
      const transcription = await prisma.transcription.findUnique({
        where: { id },
      });

      if (!transcription) {
        return NextResponse.json(
          { error: 'Transcription not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        id: transcription.id,
        text: transcription.text,
        processedText: transcription.processedText,
        provider: transcription.provider,
        model: transcription.model,
        language: transcription.language,
        duration: transcription.duration,
        confidence: transcription.confidence,
        wordCount: transcription.wordCount,
        status: transcription.status,
        metadata: transcription.metadata ? JSON.parse(transcription.metadata) : null,
        createdAt: transcription.createdAt,
        updatedAt: transcription.updatedAt,
      });
    }

    // Otherwise, return list of all transcriptions
    const transcriptions = await prisma.transcription.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to most recent 100
    });

    return NextResponse.json(transcriptions.map(t => ({
      id: t.id,
      text: t.text,
      processedText: t.processedText,
      provider: t.provider,
      model: t.model,
      language: t.language,
      duration: t.duration,
      confidence: t.confidence,
      wordCount: t.wordCount,
      status: t.status,
      metadata: t.metadata ? JSON.parse(t.metadata) : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })));

  } catch (error) {
    console.error('GET transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transcription' },
      { status: 500 }
    );
  }
}
