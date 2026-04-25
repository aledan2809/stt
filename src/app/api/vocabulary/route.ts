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
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(100),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse({
      domain: searchParams.get('domain') || undefined,
      active: searchParams.get('active') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 100,
    });

    const where: Record<string, unknown> = {};

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

    const [vocabulary, total] = await Promise.all([
      prisma.customVocabulary.findMany({
        where,
        orderBy: { term: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.customVocabulary.count({ where }),
    ]);

    return NextResponse.json({
      vocabulary,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
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

      const created = [];
      let skipped = 0;
      for (const term of data.terms) {
        const existing = await prisma.customVocabulary.findFirst({
          where: { term: term.term, domain: term.domain },
        });
        if (existing) {
          skipped++;
          continue;
        }
        const entry = await prisma.customVocabulary.create({ data: term });
        created.push(entry);
      }

      return NextResponse.json({ vocabulary: created, count: created.length, skipped }, { status: 201 });
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
