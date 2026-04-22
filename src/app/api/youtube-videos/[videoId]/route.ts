import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { videoId } = await params;
  const values = await req.json();

  const video = await prisma.youTubeVideo.update({
    where: { id: videoId },
    data: values,
  });

  return NextResponse.json(video);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    return errorResponse(e);
  }

  const { videoId } = await params;

  await prisma.youTubeVideo.delete({ where: { id: videoId } });

  return NextResponse.json({ success: true });
}
