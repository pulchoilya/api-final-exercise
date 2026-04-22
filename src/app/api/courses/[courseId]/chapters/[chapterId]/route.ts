import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { chapterId } = await params;
  const values = await req.json();

  const chapter = await prisma.chapter.update({
    where: { id: chapterId },
    data: values,
  });

  return NextResponse.json(chapter);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { courseId, chapterId } = await params;

  await prisma.chapter.delete({ where: { id: chapterId } });

  const publishedChapters = await prisma.chapter.count({
    where: { courseId, isPublished: true },
  });

  if (publishedChapters === 0) {
    await prisma.course.update({
      where: { id: courseId },
      data: { isPublished: false },
    });
  }

  return NextResponse.json({ success: true });
}
