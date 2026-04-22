import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    const userId = auth.sub;

    const purchases = await prisma.purchase.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, title: true, slug: true, imageUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(purchases);
  } catch (e) {
    return errorResponse(e);
  }
}
