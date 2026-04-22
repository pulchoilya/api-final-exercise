import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ tagId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { tagId } = await params;

  await prisma.tag.delete({ where: { id: tagId } });

  return NextResponse.json({ success: true });
}
