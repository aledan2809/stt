// STT Module - Transcription Status API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Poll transcription status
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const transcription = await prisma.transcription.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        provider: true,
        duration: true,
        wordCount: true,
        confidence: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: transcription.id,
      status: transcription.status,
      provider: transcription.provider,
      duration: transcription.duration,
      wordCount: transcription.wordCount,
      confidence: transcription.confidence,
      createdAt: transcription.createdAt,
      updatedAt: transcription.updatedAt,
    });
  } catch (error) {
    console.error('GET transcription status error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transcription status' },
      { status: 500 }
    );
  }
}
