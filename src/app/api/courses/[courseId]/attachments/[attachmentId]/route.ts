import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; attachmentId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { attachmentId } = await params;

  await prisma.attachment.delete({ where: { id: attachmentId } });

  return NextResponse.json({ success: true });
}
