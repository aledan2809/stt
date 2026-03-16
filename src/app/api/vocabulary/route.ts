// STT Module - Vocabulary API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const createVocabularySchema = z.object({
  term: z.string().min(1).max(255),
  domain: z.enum(['general', 'medical', 'dental']),
  phoneticHint: z.string().max(500).optional(),
  replacement: z.string().max(255).optional(),
  isActive: z.boolean().default(true),
});

const createBulkVocabularySchema = z.object({
  terms: z.array(createVocabularySchema),
});

const listQuerySchema = z.object({
  domain: z.enum(['general', 'medical', 'dental']).optional(),
  active: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse({
      domain: searchParams.get('domain') || undefined,
      active: searchParams.get('active') || undefined,
      search: searchParams.get('search') || undefined,
    });

    const where: any = {};

    if (query.domain) {
      where.domain = query.domain;
    }

    if (query.active !== undefined) {
      where.isActive = query.active === 'true';
    }

    if (query.search) {
      where.OR = [
        { term: { contains: query.search } },
        { replacement: { contains: query.search } },
      ];
    }

    const vocabulary = await prisma.customVocabulary.findMany({
      where,
      orderBy: { term: 'asc' },
    });

    return NextResponse.json({ vocabulary });
  } catch (error) {
    console.error('GET vocabulary error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve vocabulary' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (Array.isArray(body.terms)) {
      const data = createBulkVocabularySchema.parse(body);

      const created = await prisma.$transaction(
        data.terms.map(term =>
          prisma.customVocabulary.create({ data: term })
        )
      );

      return NextResponse.json({ vocabulary: created, count: created.length }, { status: 201 });
    }

    const data = createVocabularySchema.parse(body);

    const existing = await prisma.customVocabulary.findFirst({
      where: { term: data.term, domain: data.domain },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Term already exists in this domain' },
        { status: 409 }
      );
    }

    const vocabulary = await prisma.customVocabulary.create({ data });

    return NextResponse.json(vocabulary, { status: 201 });
  } catch (error) {
    console.error('POST vocabulary error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create vocabulary entry' },
      { status: 500 }
    );
  }
}
