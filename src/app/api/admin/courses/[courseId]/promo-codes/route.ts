import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { createPromoCodeSchema } from '@/lib/validations/promo';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { courseId } = await params;

  const promoCodes = await prisma.promoCode.findMany({
    where: { courseId },
    include: { _count: { select: { usages: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(promoCodes);
}

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

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  const body = await req.json();
  const validated = createPromoCodeSchema.safeParse(body);

  if (!validated.success) {
    return NextResponse.json(
      { error: validated.error.issues[0]?.message ?? 'Invalid data' },
      { status: 400 },
    );
  }

  const { code, discountPercent, maxUses, expiresAt } = validated.data;

  const existing = await prisma.promoCode.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json(
      { error: 'Promo code with this code already exists' },
      { status: 409 },
    );
  }

  const promoCode = await prisma.promoCode.create({
    data: {
      code,
      courseId,
      discountPercent,
      maxUses: maxUses ?? null,
      expiresAt,
    },
  });

  return NextResponse.json(promoCode, { status: 201 });
}
