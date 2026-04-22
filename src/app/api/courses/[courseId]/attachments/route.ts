import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { courseId } = await params;
  const { name, url } = await req.json();

  if (!name || !url) {
    return NextResponse.json(
      { error: 'Name and URL are required' },
      { status: 400 },
    );
  }

  const attachment = await prisma.attachment.create({
    data: { name, url, courseId },
  });

  return NextResponse.json(attachment, { status: 201 });
}
