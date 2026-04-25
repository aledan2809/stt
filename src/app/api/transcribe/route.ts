// STT Module - Transcription API Route
// Last Updated: 2026-03-12

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { sttManager } from '@/lib/stt/manager';
import { audioManager } from '@/lib/audio/manager';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import type { TranscribeOptions } from '@/types/stt';

// Simple lock to prevent concurrent whisper-local auto-start attempts
let whisperStartPromise: Promise<boolean> | null = null;

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

async function handlePOST(request: NextRequest) {
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
    let options = {};
    if (optionsJson) {
      try {
        options = JSON.parse(optionsJson);
      } catch {
        return NextResponse.json(
          { error: 'Invalid options JSON format' },
          { status: 400 }
        );
      }
    }
    const validatedOptions = transcribeSchema.parse(options);

    // Convert audio file to buffer
    let audioBuffer: Buffer = Buffer.from(await audioFile.arrayBuffer()) as Buffer;

    // Validate audio file format and convert if necessary
    if (!audioManager.validateAudioFile(audioFile.name, audioBuffer)) {
      return NextResponse.json(
        { error: 'Invalid or corrupted audio file format' },
        { status: 400 }
      );
    }

    // Convert WebM to WAV for better provider compatibility
    if (audioFile.type === 'audio/webm' || audioFile.name.toLowerCase().endsWith('.webm')) {
      try {
        console.log('Converting WebM to WAV for provider compatibility...');
        audioBuffer = await audioManager.webmToWav(audioBuffer);
      } catch (conversionError) {
        console.error('Audio conversion error:', conversionError);
        // Check if ffmpeg is available
        const ffmpegCheck = await audioManager.checkFFmpegAvailability();
        if (!ffmpegCheck.available) {
          return NextResponse.json(
            { error: 'ffmpeg not available for audio conversion. Please install ffmpeg or upload a WAV/MP3 file.' },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: `Audio conversion failed: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}` },
          { status: 500 }
        );
      }
    }

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

    // Auto-start whisper-local server if needed (with race condition guard)
    if (providerName === 'whisper-local') {
      let serverReady = false;
      try {
        const health = await fetch('http://127.0.0.1:8787/health', {
          signal: AbortSignal.timeout(2000),
        });
        serverReady = health.ok;
      } catch {
        serverReady = false;
      }

      if (!serverReady) {
        // Use a shared promise to prevent concurrent start attempts
        if (!whisperStartPromise) {
          whisperStartPromise = (async () => {
            try {
              const startRes = await fetch(`${new URL(request.url).origin}/api/whisper-server`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' }),
              });
              const startData = await startRes.json();
              return !!startData.success;
            } catch {
              return false;
            } finally {
              whisperStartPromise = null;
            }
          })();
        }

        const started = await whisperStartPromise;
        if (!started) {
          return NextResponse.json(
            { error: 'Whisper server nu a pornit. Verifică setup-ul.' },
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
        model: validatedOptions.model || (result.metadata?.model as string) || 'default',
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

// Apply rate limiting to POST requests
export const POST = withRateLimit(rateLimiters.transcription, handlePOST);

// Query schema for list endpoint
const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  provider: z.enum(['openai-whisper', 'deepgram', 'vatis-tech', 'whisper-local']).optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
});

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
        metadata: transcription.metadata ? (() => { try { return JSON.parse(transcription.metadata!); } catch { return null; } })() : null,
        createdAt: transcription.createdAt,
        updatedAt: transcription.updatedAt,
      });
    }

    // Parse pagination and filter params
    const query = listQuerySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      provider: searchParams.get('provider') || undefined,
      status: searchParams.get('status') || undefined,
    });

    const where: Record<string, unknown> = {};
    if (query.provider) where.provider = query.provider;
    if (query.status) where.status = query.status;

    const [transcriptions, total] = await Promise.all([
      prisma.transcription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.transcription.count({ where }),
    ]);

    return NextResponse.json({
      transcriptions: transcriptions.map(t => ({
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
        metadata: t.metadata ? (() => { try { return JSON.parse(t.metadata!); } catch { return null; } })() : null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });

  } catch (error) {
    console.error('GET transcription error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve transcription' },
      { status: 500 }
    );
  }
}
