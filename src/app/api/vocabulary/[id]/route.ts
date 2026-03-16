// STT Module - Vocabulary Detail API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const updateVocabularySchema = z.object({
  term: z.string().min(1).max(255).optional(),
  domain: z.enum(['general', 'medical', 'dental']).optional(),
  phoneticHint: z.string().max(500).nullable().optional(),
  replacement: z.string().max(255).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const vocabulary = await prisma.customVocabulary.findUnique({
      where: { id },
    });

    if (!vocabulary) {
      return NextResponse.json(
        { error: 'Vocabulary entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vocabulary);
  } catch (error) {
    console.error('GET vocabulary error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve vocabulary entry' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateVocabularySchema.parse(body);

    const existing = await prisma.customVocabulary.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Vocabulary entry not found' },
        { status: 404 }
      );
    }

    if (data.term && data.term !== existing.term) {
      const domain = data.domain || existing.domain;
      const duplicate = await prisma.customVocabulary.findFirst({
        where: { term: data.term, domain, NOT: { id } },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Term already exists in this domain' },
          { status: 409 }
        );
      }
    }

    const vocabulary = await prisma.customVocabulary.update({
      where: { id },
      data,
    });

    return NextResponse.json(vocabulary);
  } catch (error) {
    console.error('PUT vocabulary error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update vocabulary entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.customVocabulary.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Vocabulary entry not found' },
        { status: 404 }
      );
    }

    await prisma.customVocabulary.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Vocabulary entry deleted' });
  } catch (error) {
    console.error('DELETE vocabulary error:', error);
    return NextResponse.json(
      { error: 'Failed to delete vocabulary entry' },
      { status: 500 }
    );
  }
}
