import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { userId } = await params;
  const body = await req.json();

  const allowed: Record<string, unknown> = {};
  if (typeof body.name === 'string') allowed.name = body.name.trim() || null;
  if (typeof body.email === 'string') allowed.email = body.email.trim();
  if (typeof body.isActive === 'boolean') allowed.isActive = body.isActive;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: allowed,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 400 },
    );
  }
}
