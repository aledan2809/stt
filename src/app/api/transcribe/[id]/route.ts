// STT Module - Transcription by ID API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as fs from 'fs/promises';
import * as path from 'path';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Retrieve transcription by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const transcription = await prisma.transcription.findUnique({
      where: { id },
      include: {
        report: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
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
      text: transcription.text,
      processedText: transcription.processedText,
      provider: transcription.provider,
      model: transcription.model,
      language: transcription.language,
      duration: transcription.duration,
      confidence: transcription.confidence,
      wordCount: transcription.wordCount,
      status: transcription.status,
      audioPath: transcription.audioPath,
      metadata: transcription.metadata ? JSON.parse(transcription.metadata) : null,
      report: transcription.report,
      createdAt: transcription.createdAt,
      updatedAt: transcription.updatedAt,
    });
  } catch (error) {
    console.error('GET transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve transcription' },
      { status: 500 }
    );
  }
}

// DELETE - Delete transcription and associated audio file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const transcription = await prisma.transcription.findUnique({
      where: { id },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }

    // Delete associated audio file if it exists
    if (transcription.audioPath) {
      try {
        const audioFullPath = path.resolve(process.cwd(), transcription.audioPath);
        await fs.unlink(audioFullPath);
      } catch (fileError) {
        // Log but don't fail if audio file doesn't exist
        console.warn('Could not delete audio file:', fileError);
      }
    }

    // Delete transcription from database
    await prisma.transcription.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Transcription deleted successfully',
    });
  } catch (error) {
    console.error('DELETE transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to delete transcription' },
      { status: 500 }
    );
  }
}

// PATCH - Update transcription (e.g., processed text, status)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    const transcription = await prisma.transcription.findUnique({
      where: { id },
    });

    if (!transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      );
    }

    // Only allow updating specific fields
    const allowedUpdates: Record<string, unknown> = {};
    if (body.processedText !== undefined) allowedUpdates.processedText = body.processedText;
    if (body.status !== undefined) allowedUpdates.status = body.status;
    if (body.reportId !== undefined) allowedUpdates.reportId = body.reportId;

    if (Object.keys(allowedUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updated = await prisma.transcription.update({
      where: { id },
      data: allowedUpdates,
    });

    return NextResponse.json({
      id: updated.id,
      text: updated.text,
      processedText: updated.processedText,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('PATCH transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to update transcription' },
      { status: 500 }
    );
  }
}
