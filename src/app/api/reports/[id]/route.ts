// STT Module - Report Detail API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const updateReportSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  templateId: z.string().nullable().optional(),
  patientRef: z.string().nullable().optional(),
  domain: z.enum(['general', 'medical', 'dental']).optional(),
  status: z.enum(['draft', 'final', 'exported']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        template: true,
        transcriptions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('GET report error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
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
    const data = updateReportSchema.parse(body);

    const existing = await prisma.report.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    const report = await prisma.report.update({
      where: { id },
      data,
      include: {
        template: { select: { id: true, name: true } },
        transcriptions: { select: { id: true, text: true, createdAt: true } },
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('PUT report error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update report' },
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

    const existing = await prisma.report.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    await prisma.report.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Report deleted' });
  } catch (error) {
    console.error('DELETE report error:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
}
