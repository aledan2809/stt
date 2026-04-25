// STT Module - Vocabulary Import API Route
// Last Updated: 2026-03-13

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const importSchema = z.object({
  domain: z.enum(['general', 'medical', 'dental']),
  skipDuplicates: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const domain = formData.get('domain') as string;
    const skipDuplicates = formData.get('skipDuplicates') !== 'false';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for CSV/TSV)
    const MAX_IMPORT_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_IMPORT_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_IMPORT_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'text/plain', 'text/tab-separated-values', 'application/csv'];
    const allowedExtensions = ['.csv', '.tsv', '.txt'];
    const fileExtension = file.name ? '.' + file.name.split('.').pop()?.toLowerCase() : '';
    if (file.type && !allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file type. Accepted: CSV, TSV, or plain text files' },
        { status: 400 }
      );
    }

    const validatedOptions = importSchema.parse({
      domain: domain || 'general',
      skipDuplicates,
    });

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    const hasHeader = lines[0].toLowerCase().includes('term') ||
                      lines[0].toLowerCase().includes('replacement') ||
                      lines[0].toLowerCase().includes('phonetic');

    const dataLines = hasHeader ? lines.slice(1) : lines;

    const entries: Array<{
      term: string;
      domain: string;
      phoneticHint?: string;
      replacement?: string;
      isActive: boolean;
    }> = [];

    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const parts = parseCSVLine(line);

      if (parts.length === 0 || !parts[0]) {
        errors.push(`Line ${i + (hasHeader ? 2 : 1)}: Empty term`);
        continue;
      }

      entries.push({
        term: parts[0].trim(),
        domain: validatedOptions.domain,
        replacement: parts[1]?.trim() || undefined,
        phoneticHint: parts[2]?.trim() || undefined,
        isActive: true,
      });
    }

    let imported = 0;
    let skipped = 0;

    if (validatedOptions.skipDuplicates) {
      const existingTerms = await prisma.customVocabulary.findMany({
        where: { domain: validatedOptions.domain },
        select: { term: true },
      });

      const existingSet = new Set(existingTerms.map(t => t.term.toLowerCase()));

      const newEntries = entries.filter(entry => {
        if (existingSet.has(entry.term.toLowerCase())) {
          skipped++;
          return false;
        }
        return true;
      });

      if (newEntries.length > 0) {
        await prisma.customVocabulary.createMany({
          data: newEntries,
        });
        imported = newEntries.length;
      }
    } else {
      for (const entry of entries) {
        try {
          // Find existing entry by term+domain since there's no composite unique constraint
          const existing = await prisma.customVocabulary.findFirst({
            where: { term: entry.term, domain: entry.domain },
          });

          if (existing) {
            await prisma.customVocabulary.update({
              where: { id: existing.id },
              data: {
                replacement: entry.replacement,
                phoneticHint: entry.phoneticHint,
                isActive: entry.isActive,
              },
            });
          } else {
            await prisma.customVocabulary.create({
              data: entry,
            });
          }
          imported++;
        } catch (e: unknown) {
          errors.push(`Failed to import "${entry.term}": ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
      total: entries.length,
    });
  } catch (error) {
    console.error('Import vocabulary error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to import vocabulary' },
      { status: 500 }
    );
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}
