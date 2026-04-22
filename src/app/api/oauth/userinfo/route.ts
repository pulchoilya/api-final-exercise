import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);

    if (auth.type === 'client') {
      return NextResponse.json({
        sub: auth.sub,
        type: 'client',
        scopes: auth.scopes,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (e) {
    return errorResponse(e);
  }
}
