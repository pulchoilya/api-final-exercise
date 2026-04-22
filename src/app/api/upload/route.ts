import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/dojo-api-uploads';

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/markdown',
  'application/json',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export async function POST(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File too large (max 50 MB)' },
      { status: 400 },
    );
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `File type not allowed: ${file.type}` },
      { status: 400 },
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = `${randomUUID()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });

  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, safeName), bytes);

  const url = `/api/uploads/${safeName}`;

  return NextResponse.json(
    { url, name: file.name, size: file.size, type: file.type },
    { status: 201 },
  );
}
