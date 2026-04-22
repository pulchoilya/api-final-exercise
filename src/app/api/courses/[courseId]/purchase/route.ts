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
    const promoCodeValue =
      (body.promoCode as string)?.toUpperCase()?.trim() || null;

    const course = await prisma.course.findUnique({
      where: { id: courseId, isPublished: true },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const existingPurchase = await prisma.purchase.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existingPurchase) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 409 });
    }

    let finalPrice = Number(course.price ?? 0);
    let appliedPromoCode: string | null = null;
    let promoCodeRecord: { id: string; code: string } | null = null;

    if (promoCodeValue && finalPrice > 0) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCodeValue },
      });

      if (
        promo &&
        promo.courseId === courseId &&
        promo.isActive &&
        promo.expiresAt > new Date() &&
        (promo.maxUses === null || promo.currentUses < promo.maxUses)
      ) {
        const existingUsage = await prisma.promoCodeUsage.findUnique({
          where: {
            promoCodeId_userId: { promoCodeId: promo.id, userId },
          },
        });

        if (!existingUsage) {
          const discount = (finalPrice * promo.discountPercent) / 100;
          finalPrice = Math.max(0, finalPrice - discount);
          appliedPromoCode = promo.code;
          promoCodeRecord = { id: promo.id, code: promo.code };
        }
      }
    }

    // Mock payment — always succeed
    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: {
          userId,
          courseId,
          amount: finalPrice,
          promoCode: appliedPromoCode,
        },
      });

      if (promoCodeRecord) {
        await tx.promoCodeUsage.create({
          data: { promoCodeId: promoCodeRecord.id, userId },
        });
        await tx.promoCode.update({
          where: { id: promoCodeRecord.id },
          data: { currentUses: { increment: 1 } },
        });
      }

      return p;
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (e) {
    return errorResponse(e);
  }
}
