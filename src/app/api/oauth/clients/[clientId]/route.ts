import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { clientId } = await params;

  const client = await prisma.oAuthClient.findUnique({
    where: { clientId },
  });

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  await prisma.oAuthClient.update({
    where: { clientId },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
