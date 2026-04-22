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
  const { title } = await req.json();

  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const lastChapter = await prisma.chapter.findFirst({
    where: { courseId },
    orderBy: { position: 'desc' },
  });

  const position = lastChapter ? lastChapter.position + 1 : 1;

  const chapter = await prisma.chapter.create({
    data: { title: title.trim(), courseId, position },
  });

  return NextResponse.json(chapter, { status: 201 });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  await params; // consume params
  const { list } = await req.json();

  for (const item of list) {
    await prisma.chapter.update({
      where: { id: item.id },
      data: { position: item.position },
    });
  }

  return NextResponse.json({ success: true });
}
