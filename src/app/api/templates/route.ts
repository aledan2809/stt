// STT Module - Templates API Route
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

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  structure: templateStructureSchema,
  domain: z.enum(['general', 'medical', 'dental']),
  isDefault: z.boolean().default(false),
});

const listQuerySchema = z.object({
  domain: z.enum(['general', 'medical', 'dental']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse({
      domain: searchParams.get('domain') || undefined,
    });

    const where: Record<string, unknown> = {};

    if (query.domain) {
      where.domain = query.domain;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
    });

    const formattedTemplates = templates.map(t => ({
      ...t,
      structure: (() => { try { return JSON.parse(t.structure); } catch { return { sections: [] }; } })(),
    }));

    return NextResponse.json({ templates: formattedTemplates });
  } catch (error) {
    console.error('GET templates error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to retrieve templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createTemplateSchema.parse(body);

    if (data.isDefault) {
      await prisma.template.updateMany({
        where: { domain: data.domain, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.template.create({
      data: {
        name: data.name,
        structure: JSON.stringify(data.structure),
        domain: data.domain,
        isDefault: data.isDefault,
      },
    });

    return NextResponse.json({
      ...template,
      structure: (() => { try { return JSON.parse(template.structure); } catch { return { sections: [] }; } })(),
    }, { status: 201 });
  } catch (error) {
    console.error('POST template error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
