// STT Module - Report Export API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const exportSchema = z.object({
  format: z.enum(['pdf', 'docx', 'markdown', 'html']).default('pdf'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { format } = exportSchema.parse(body);

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

    let content: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'markdown':
        content = generateMarkdown(report);
        contentType = 'text/markdown';
        filename = `${sanitizeFilename(report.title)}.md`;
        break;

      case 'html':
        content = generateHtml(report);
        contentType = 'text/html';
        filename = `${sanitizeFilename(report.title)}.html`;
        break;

      case 'pdf':
      case 'docx':
        return NextResponse.json(
          { error: `${format.toUpperCase()} export not yet implemented. Use markdown or html.` },
          { status: 501 }
        );

      default:
        return NextResponse.json(
          { error: 'Invalid export format' },
          { status: 400 }
        );
    }

    await prisma.report.update({
      where: { id },
      data: { status: 'exported' },
    });

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export report error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to export report' },
      { status: 500 }
    );
  }
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100);
}

function generateMarkdown(report: any): string {
  const lines: string[] = [];

  lines.push(`# ${report.title}`);
  lines.push('');
  lines.push(`**Created:** ${new Date(report.createdAt).toLocaleString()}`);
  lines.push(`**Last Updated:** ${new Date(report.updatedAt).toLocaleString()}`);
  lines.push(`**Domain:** ${report.domain}`);
  lines.push(`**Status:** ${report.status}`);

  if (report.patientRef) {
    lines.push(`**Patient Reference:** ${report.patientRef}`);
  }

  if (report.template) {
    lines.push(`**Template:** ${report.template.name}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Content');
  lines.push('');
  lines.push(report.content);

  if (report.transcriptions && report.transcriptions.length > 0) {
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## Source Transcriptions');
    lines.push('');

    report.transcriptions.forEach((t: any, index: number) => {
      lines.push(`### Transcription ${index + 1}`);
      lines.push(`*${new Date(t.createdAt).toLocaleString()}*`);
      lines.push('');
      lines.push(t.text);
      lines.push('');
    });
  }

  return lines.join('\n');
}

function generateHtml(report: any): string {
  const escapedTitle = escapeHtml(report.title);
  const escapedContent = escapeHtml(report.content).replace(/\n/g, '<br>');

  let html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
    h1 { color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 0.5rem; }
    .metadata { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .metadata span { display: block; margin: 0.25rem 0; }
    .content { margin-top: 2rem; }
    hr { border: none; border-top: 1px solid #ddd; margin: 2rem 0; }
    .transcription { background: #f5f5f5; padding: 1rem; border-radius: 4px; margin: 1rem 0; }
    .transcription-header { font-weight: bold; color: #444; }
    .transcription-date { font-size: 0.85rem; color: #888; }
  </style>
</head>
<body>
  <h1>${escapedTitle}</h1>
  <div class="metadata">
    <span><strong>Created:</strong> ${new Date(report.createdAt).toLocaleString()}</span>
    <span><strong>Last Updated:</strong> ${new Date(report.updatedAt).toLocaleString()}</span>
    <span><strong>Domain:</strong> ${report.domain}</span>
    <span><strong>Status:</strong> ${report.status}</span>`;

  if (report.patientRef) {
    html += `\n    <span><strong>Patient Reference:</strong> ${escapeHtml(report.patientRef)}</span>`;
  }

  if (report.template) {
    html += `\n    <span><strong>Template:</strong> ${escapeHtml(report.template.name)}</span>`;
  }

  html += `
  </div>
  <hr>
  <div class="content">
    <h2>Content</h2>
    <p>${escapedContent}</p>
  </div>`;

  if (report.transcriptions && report.transcriptions.length > 0) {
    html += `
  <hr>
  <div class="transcriptions">
    <h2>Source Transcriptions</h2>`;

    report.transcriptions.forEach((t: any, index: number) => {
      html += `
    <div class="transcription">
      <div class="transcription-header">Transcription ${index + 1}</div>
      <div class="transcription-date">${new Date(t.createdAt).toLocaleString()}</div>
      <p>${escapeHtml(t.text).replace(/\n/g, '<br>')}</p>
    </div>`;
    });

    html += `
  </div>`;
  }

  html += `
</body>
</html>`;

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
