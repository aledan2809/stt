// STT Module - Vocabulary Export API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const exportQuerySchema = z.object({
  domain: z.enum(['general', 'medical', 'dental']).optional(),
  active: z.enum(['true', 'false']).optional(),
  format: z.enum(['csv', 'json']).default('csv'),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = exportQuerySchema.parse({
      domain: searchParams.get('domain') || undefined,
      active: searchParams.get('active') || undefined,
      format: searchParams.get('format') || 'csv',
    });

    const where: Record<string, unknown> = {};

    if (query.domain) {
      where.domain = query.domain;
    }

    if (query.active !== undefined) {
      where.isActive = query.active === 'true';
    }

    const vocabulary = await prisma.customVocabulary.findMany({
      where,
      orderBy: [
        { domain: 'asc' },
        { term: 'asc' },
      ],
    });

    if (vocabulary.length === 0) {
      return NextResponse.json(
        { error: 'No vocabulary entries found' },
        { status: 404 }
      );
    }

    const safeDomain = (query.domain || 'all').replace(/[^a-zA-Z0-9_-]/g, '');

    if (query.format === 'json') {
      return new NextResponse(JSON.stringify(vocabulary, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="vocabulary-${safeDomain}.json"`,
        },
      });
    }

    const csvLines: string[] = [];
    csvLines.push('term,replacement,phonetic_hint,domain,is_active');

    for (const entry of vocabulary) {
      const term = escapeCSV(entry.term);
      const replacement = escapeCSV(entry.replacement || '');
      const phoneticHint = escapeCSV(entry.phoneticHint || '');
      const domain = escapeCSV(entry.domain);
      const isActive = entry.isActive ? 'true' : 'false';

      csvLines.push(`${term},${replacement},${phoneticHint},${domain},${isActive}`);
    }

    const csv = csvLines.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vocabulary-${safeDomain}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export vocabulary error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to export vocabulary' },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
