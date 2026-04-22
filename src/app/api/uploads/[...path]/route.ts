import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/dojo-api-uploads';

const MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  zip: 'application/zip',
  txt: 'text/plain',
  md: 'text/markdown',
  json: 'application/json',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const filename = segments.join('/');

  // Prevent directory traversal
  if (filename.includes('..') || filename.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const filePath = join(UPLOAD_DIR, filename);

  try {
    await stat(filePath);
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const data = await readFile(filePath);
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  return new NextResponse(data, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
