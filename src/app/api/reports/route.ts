// STT Module - Reports API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const createReportSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  templateId: z.string().optional(),
  patientRef: z.string().optional(),
  domain: z.enum(['general', 'medical', 'dental']).default('general'),
  transcriptionIds: z.array(z.string()).optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  domain: z.enum(['general', 'medical', 'dental']).optional(),
  status: z.enum(['draft', 'final', 'exported']).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      domain: searchParams.get('domain') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    });

    const where: Record<string, unknown> = {};

    if (query.domain) {
      where.domain = query.domain;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { content: { contains: query.search } },
      ];
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          template: { select: { id: true, name: true } },
          transcriptions: { select: { id: true, text: true, createdAt: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.report.count({ where }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    console.error('GET reports error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createReportSchema.parse(body);

    const report = await prisma.report.create({
      data: {
        title: data.title,
        content: data.content,
        templateId: data.templateId,
        patientRef: data.patientRef,
        domain: data.domain,
        status: 'draft',
        transcriptions: data.transcriptionIds
          ? { connect: data.transcriptionIds.map(id => ({ id })) }
          : undefined,
      },
      include: {
        template: { select: { id: true, name: true } },
        transcriptions: { select: { id: true, text: true, createdAt: true } },
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error('POST report error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}
