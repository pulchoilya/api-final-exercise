import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const auth = await requireAuth(req);
    const userId = auth.sub;
    const { courseId } = await params;

    const chapters = await prisma.chapter.findMany({
      where: { courseId },
      select: { id: true, title: true, position: true },
      orderBy: { position: 'asc' },
    });

    const progress = await prisma.userProgress.findMany({
      where: {
        userId,
        chapterId: { in: chapters.map((c) => c.id) },
      },
    });

    const progressMap = new Map(
      progress.map((p) => [p.chapterId, p.isCompleted]),
    );

    return NextResponse.json({
      courseId,
      chapters: chapters.map((c) => ({
        ...c,
        isCompleted: progressMap.get(c.id) ?? false,
      })),
      completedCount: progress.filter((p) => p.isCompleted).length,
      totalCount: chapters.length,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
