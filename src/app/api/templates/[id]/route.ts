// STT Module - Template Detail API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const templateStructureSchema = z.object({
  sections: z.array(z.object({
    id: z.string(),
    name: z.string(),
    prompt: z.string().optional(),
    required: z.boolean().default(false),
  })),
});

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  structure: templateStructureSchema.optional(),
  domain: z.enum(['general', 'medical', 'dental']).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.template.findUnique({
      where: { id },
      include: {
        reports: { select: { id: true, title: true, createdAt: true } },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...template,
      structure: (() => { try { return JSON.parse(template.structure); } catch { return { sections: [] }; } })(),
    });
  } catch (error) {
    console.error('GET template error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve template' },
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
    const data = updateTemplateSchema.parse(body);

    const existing = await prisma.template.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    const domain = data.domain || existing.domain;

    if (data.isDefault) {
      await prisma.template.updateMany({
        where: { domain, isDefault: true, NOT: { id } },
        data: { isDefault: false },
      });
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.structure !== undefined) {
      updateData.structure = JSON.stringify(data.structure);
    }

    if (data.domain !== undefined) {
      updateData.domain = data.domain;
    }

    if (data.isDefault !== undefined) {
      updateData.isDefault = data.isDefault;
    }

    const template = await prisma.template.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...template,
      structure: (() => { try { return JSON.parse(template.structure); } catch { return { sections: [] }; } })(),
    });
  } catch (error) {
    console.error('PUT template error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update template' },
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

    const existing = await prisma.template.findUnique({
      where: { id },
      include: { reports: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (existing.reports.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete template: ${existing.reports.length} reports are using it` },
        { status: 409 }
      );
    }

    await prisma.template.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('DELETE template error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
