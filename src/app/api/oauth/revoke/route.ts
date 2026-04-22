import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    await requireAuth(req);
  } catch (e) {
    return errorResponse(e);
  }

  const body = await req.json();
  const token = body.token;

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const deleted = await prisma.refreshToken.deleteMany({
    where: { token },
  });

  if (deleted.count === 0) {
    return NextResponse.json({ error: 'Token not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
