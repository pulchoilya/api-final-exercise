import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const auth = await requireAuth(req);
    const userId = auth.sub;
    const { courseId } = await params;

    const body = await req.json();
    const code = (body.code as string)?.toUpperCase()?.trim();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'Enter a promo code' },
        { status: 400 },
      );
    }

    const promoCode = await prisma.promoCode.findUnique({ where: { code } });

    if (!promoCode || promoCode.courseId !== courseId) {
      return NextResponse.json({ valid: false, error: 'Promo code not found' });
    }

    if (!promoCode.isActive) {
      return NextResponse.json({
        valid: false,
        error: 'Promo code is deactivated',
      });
    }

    if (promoCode.expiresAt < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Promo code has expired',
      });
    }

    if (
      promoCode.maxUses !== null &&
      promoCode.currentUses >= promoCode.maxUses
    ) {
      return NextResponse.json({
        valid: false,
        error: 'Promo code usage limit reached',
      });
    }

    const existingUsage = await prisma.promoCodeUsage.findUnique({
      where: {
        promoCodeId_userId: { promoCodeId: promoCode.id, userId },
      },
    });

    if (existingUsage) {
      return NextResponse.json({
        valid: false,
        error: 'You have already used this promo code',
      });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true },
    });

    const originalPrice = Number(course?.price ?? 0);
    const discountAmount = (originalPrice * promoCode.discountPercent) / 100;
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return NextResponse.json({
      valid: true,
      discountPercent: promoCode.discountPercent,
      originalPrice,
      finalPrice,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
