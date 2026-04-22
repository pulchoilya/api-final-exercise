import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ courseId: string; promoCodeId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { promoCodeId } = await params;

  const promoCode = await prisma.promoCode.findUnique({
    where: { id: promoCodeId },
  });

  if (!promoCode) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.promoCode.update({
    where: { id: promoCodeId },
    data: { isActive: !promoCode.isActive },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; promoCodeId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { promoCodeId } = await params;

  await prisma.promoCode.delete({ where: { id: promoCodeId } });

  return NextResponse.json({ success: true });
}
