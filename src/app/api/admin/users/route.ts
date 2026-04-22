import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';

  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(users);
}
