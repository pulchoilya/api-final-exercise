import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ chapterId: string }> },
) {
  try {
    const auth = await requireAuth(req);
    const userId = auth.sub;
    const { chapterId } = await params;
    const { isCompleted } = await req.json();

    const userProgress = await prisma.userProgress.upsert({
      where: {
        userId_chapterId: { userId, chapterId },
      },
      update: { isCompleted },
      create: { userId, chapterId, isCompleted },
    });

    return NextResponse.json(userProgress);
  } catch (e) {
    return errorResponse(e);
  }
}
